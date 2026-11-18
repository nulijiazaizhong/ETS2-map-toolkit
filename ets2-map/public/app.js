(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const loading = $('#loading');
  const errorPanel = $('#error');
  const searchInput = $('#search');
  const resultsPanel = $('#search-results');
  const localeSelect = $('#locale');
  const cityToggle = $('#show-cities');
  const dlcBoundaryToggle = $('#show-dlc-boundaries');
  const backgroundToggle = $('#show-game-background');
  const sidebar = $('#sidebar');
  const backdrop = $('#backdrop');

  const regions = [
    { name: '欧洲全图', dlc: '全部区域', cities: [] },
    { name: '基础地图', dlc: 'Base map', archive: 'base_map.scs', cities: ['Berlin', '柏林'] },
    { name: '东欧', dlc: 'Going East!', archive: 'dlc_east.scs', cities: ['Warszawa', 'Warsaw', '华沙'] },
    { name: '斯堪的纳维亚', dlc: 'Scandinavia', archive: 'dlc_north.scs', cities: ['Stockholm', '斯德哥尔摩'] },
    { name: '法国', dlc: 'Vive la France!', archive: 'dlc_fr.scs', cities: ['Paris', '巴黎'] },
    { name: '意大利', dlc: 'Italia', archive: 'dlc_it.scs', cities: ['Roma', 'Rome', '罗马'] },
    { name: '波罗的海', dlc: 'Beyond the Baltic Sea', archive: 'dlc_balt.scs', cities: ['Tallinn', '塔林'] },
    { name: '黑海', dlc: 'Road to the Black Sea', archive: 'dlc_balkan_e.scs', cities: ['Sofia', 'София', '索非亚'] },
    { name: '伊比利亚', dlc: 'Iberia', archive: 'dlc_iberia.scs', cities: ['Madrid', '马德里'] },
    { name: '西巴尔干', dlc: 'West Balkans', archive: 'dlc_balkan_w.scs', cities: ['Split', '斯普利特'] },
    { name: '希腊', dlc: 'Greece', archive: 'dlc_greece.scs', cities: ['Athina', 'Athína', 'Athens', '雅典'] },
    { name: '北欧地平线', dlc: 'Nordic Horizons', archive: 'dlc_polar.scs', cities: ['Tromsø', 'Tromso', '特罗姆瑟'] },
    { name: '冰岛', dlc: 'Iceland', archive: 'dlc_iceland.scs', cities: ['Reykjavík', 'Reykjavik', '雷克雅未克'] }
  ];

  let map;
  let info;
  let cities = [];
  let dlcRegions = [];
  let backgroundInfo;
  let backgroundLayer;
  let countries = new Map();
  let allCityLayer;
  let cityLabelLayer;
  let dlcBoundaryLayer;
  let selectedMarker;
  let selectedLabel;
  let selectedCity;
  let sharedLocation;
  let sharedHeadingLayer;

  const normalize = (value) => String(value || '').toLocaleLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').trim();

  const cityName = (city) => city.LocalizedNames?.[localeSelect.value] || city.Name;
  const countryName = (city) => {
    const country = countries.get(city.CountryId);
    return country?.LocalizedNames?.[localeSelect.value] || country?.Name || city.Country;
  };

  function buildLocaleOptions() {
    const locales = [...new Set(cities.flatMap((city) => Object.keys(city.LocalizedNames || {})))].sort();
    const preferred = ['zh_cn', 'zh_tw', 'en_gb', 'en_us'];
    locales.sort((a, b) => {
      const aIndex = preferred.indexOf(a);
      const bIndex = preferred.indexOf(b);
      return (aIndex < 0 ? 100 : aIndex) - (bIndex < 0 ? 100 : bIndex) || a.localeCompare(b);
    });
    const specialNames = { zh_cn: '简体中文', zh_tw: '繁體中文', en_gb: 'English (UK)', en_us: 'English (US)' };
    const chineseNames = new Intl.DisplayNames(['zh-CN'], { type: 'language' });
    localeSelect.replaceChildren();
    locales.forEach((locale) => {
      const language = locale.split('_')[0];
      const nativeNames = new Intl.DisplayNames([language], { type: 'language' });
      const nativeName = nativeNames.of(language);
      const chineseName = chineseNames.of(language);
      const option = document.createElement('option');
      option.value = locale;
      option.textContent = specialNames[locale] || `${nativeName} · ${chineseName} (${locale.split('_')[1].toUpperCase()})`;
      localeSelect.append(option);
    });
    const nativeOption = document.createElement('option');
    nativeOption.value = 'native';
    nativeOption.textContent = '地图原文';
    localeSelect.append(nativeOption);
    localeSelect.value = 'zh_cn';
  }

  const toLatLng = (x, y) => [
    (info.y1 - y) * 512 / (info.y2 - info.y1),
    (x - info.x1) * 512 / (info.x2 - info.x1)
  ];
  const cityCenterLatLng = (city) => toLatLng(city.CenterX, city.CenterY);
  const cityLabelLatLng = (city) => toLatLng(city.NodeX ?? city.CenterX, city.NodeY ?? city.CenterY);
  const cityAreaBounds = (city) => [toLatLng(city.X, city.Y + city.Height), toLatLng(city.X + city.Width, city.Y)];

  function cityLabelOffset(city) {
    const zoomIndex = map.getZoom() >= 8 ? 0 : map.getZoom() >= 6 ? 1 : map.getZoom() >= 4 ? 2 : 3;
    return [city.MapXOffsets?.[zoomIndex] || 0, city.MapYOffsets?.[zoomIndex] || 0];
  }

  function focusRegion(region) {
    if (!region.boundary) return;
    clearSharedLocation();
    selectedMarker?.remove();
    selectedMarker = null;
    selectedCity = null;
    rebuildCityLabels();
    dlcBoundaryToggle.checked = true;
    if (!map.hasLayer(dlcBoundaryLayer)) dlcBoundaryLayer.addTo(map);
    map.fitBounds(region.boundary.getBounds(), {
      paddingTopLeft: L.point(window.innerWidth > 700 ? sidebar.offsetWidth + 60 : 45, 45),
      paddingBottomRight: L.point(45, 45)
    });
    closePanel();
  }

  function buildDlcBoundaries() {
    const colors = ['#38bdf8', '#f59e0b', '#34d399', '#a78bfa', '#f472b6', '#60a5fa', '#f97316', '#2dd4bf', '#e879f9', '#fbbf24', '#818cf8', '#22d3ee'];
    const layers = [];
    regions.forEach((region, index) => {
      if (!region.archive) return;
      const data = dlcRegions.find((item) => item.Archive === region.archive);
      if (!data) return;
      const polygons = data.Polygons.map((polygon) => L.polygon(polygon.map(([x, y]) => toLatLng(x, y)), {
        color: colors[index % colors.length],
        weight: 2,
        opacity: 0.85,
        fillColor: colors[index % colors.length],
        fillOpacity: 0.04
      }).bindTooltip(`${region.name} · ${region.dlc}`, { sticky: true, className: 'dlc-label' })
        .on('click', () => focusRegion(region)));
      region.boundary = L.featureGroup(polygons);
      layers.push(...polygons);
    });
    dlcBoundaryLayer = L.layerGroup(layers);
    if (dlcBoundaryToggle.checked) dlcBoundaryLayer.addTo(map);
  }

  function findCity(aliases) {
    const names = aliases.map(normalize);
    return cities.find((city) => [city.Name, ...Object.values(city.LocalizedNames || {})]
      .some((name) => names.includes(normalize(name))));
  }

  function clearSharedLocation() {
    sharedLocation = null;
    if (sharedHeadingLayer) sharedHeadingLayer.remove();
    sharedHeadingLayer = null;
  }

  function selectCity(city, zoom = 6) {
    if (!city) return;
    clearSharedLocation();
    selectedCity = city;
    if (selectedMarker) selectedMarker.remove();
    selectedMarker = L.marker(cityCenterLatLng(city), {
      icon: L.divIcon({ className: 'city-dot', iconSize: [10, 10] }),
      keyboard: false,
      zIndexOffset: 1000
    }).addTo(map);
    rebuildCityLabels();
    map.flyTo(cityCenterLatLng(city), Math.max(map.getZoom(), zoom), { duration: 1.1 });
    resultsPanel.classList.remove('visible');
    searchInput.value = cityName(city);
    closePanel();
  }

  function renderResults() {
    const query = normalize(searchInput.value);
    resultsPanel.replaceChildren();
    if (!query) {
      resultsPanel.classList.remove('visible');
      return;
    }
    const terms = query.split(/\s+/);
    const matches = cities.filter((city) => terms.every((term) => city.searchText.includes(term)))
      .sort((a, b) => {
        const aStarts = normalize(cityName(a)).startsWith(query) ? 0 : 1;
        const bStarts = normalize(cityName(b)).startsWith(query) ? 0 : 1;
        return aStarts - bStarts || cityName(a).localeCompare(cityName(b));
      }).slice(0, 8);
    if (!matches.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-result';
      empty.textContent = '没有找到匹配的城市';
      resultsPanel.append(empty);
    }
    matches.forEach((city) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'result';
      button.setAttribute('role', 'option');
      const text = document.createElement('div');
      const name = document.createElement('strong');
      const country = document.createElement('small');
      const arrow = document.createElement('span');
      name.textContent = cityName(city);
      country.textContent = `${countryName(city)} · ${city.Name}`;
      arrow.textContent = '›';
      text.append(name, country);
      button.append(text, arrow);
      button.addEventListener('click', () => selectCity(city));
      resultsPanel.append(button);
    });
    resultsPanel.classList.add('visible');
  }

  function rebuildCityLayer() {
    if (allCityLayer) allCityLayer.remove();
    const layers = cities.flatMap((city) => [
      L.rectangle(cityAreaBounds(city), {
        interactive: false,
        color: '#38bdf8',
        weight: 1,
        opacity: 0.55,
        fillColor: '#0ea5e9',
        fillOpacity: 0.08
      }),
      L.circleMarker(cityCenterLatLng(city), {
        radius: 3,
        color: '#bae6fd',
        weight: 1,
        fillColor: '#0ea5e9',
        fillOpacity: 0.9,
        bubblingMouseEvents: false
      }).bindTooltip(`${cityName(city)}<br><small>${countryName(city)}</small>`, { direction: 'top' })
        .on('click', () => selectCity(city))
    ]);
    allCityLayer = L.layerGroup(layers);
    if (cityToggle.checked) allCityLayer.addTo(map);
  }

  function rebuildCityLabels() {
    if (cityLabelLayer) cityLabelLayer.remove();
    if (selectedLabel) selectedLabel.remove();
    cityLabelLayer = null;
    selectedLabel = null;
    if (selectedCity) {
      selectedLabel = L.tooltip({
        permanent: true,
        direction: 'center',
        offset: cityLabelOffset(selectedCity),
        interactive: false,
        className: 'city-label'
      }).setLatLng(cityLabelLatLng(selectedCity)).setContent(cityName(selectedCity)).addTo(map);
    } else if (sharedLocation) {
      selectedLabel = L.tooltip({
        permanent: true,
        direction: 'top',
        offset: [0, -12],
        interactive: false,
        className: 'city-label'
      }).setLatLng(sharedLocation.latlng).setContent(sharedLocation.label).addTo(map);
    }
    if (map.getZoom() < 4) return;
    const groups = new Set();
    const visibleBounds = map.getBounds().pad(0.15);
    const labels = cities.filter((city) => {
      if (!visibleBounds.contains(cityLabelLatLng(city))) return false;
      if (city === selectedCity || city.Group && groups.has(city.Group)) return false;
      if (city.Group) groups.add(city.Group);
      return true;
    }).map((city) => L.tooltip({
      permanent: true,
      direction: 'center',
      offset: cityLabelOffset(city),
      interactive: false,
      className: 'map-city-label'
    }).setLatLng(cityLabelLatLng(city)).setContent(cityName(city)));
    cityLabelLayer = L.layerGroup(labels).addTo(map);
  }

  function resetView() {
    clearSharedLocation();
    map.fitBounds(map.options.maxBounds, { padding: [0, 0] });
    selectedMarker?.remove();
    selectedMarker = null;
    selectedCity = null;
    rebuildCityLabels();
    closePanel();
  }

  function showSharedLocation() {
    const params = new URLSearchParams(window.location.search);
    const x = Number(params.get('x'));
    const y = Number(params.get('y'));
    if (!params.has('x') || !params.has('y') || !Number.isFinite(x) || !Number.isFinite(y)) return;
    const point = toLatLng(x, y);
    const zoom = Math.min(info.maxZoom, Math.max(info.minZoom, Number(params.get('zoom')) || 6));
    const heading = Number(params.get('heading'));
    const label = document.createElement('div');
    const title = document.createElement('strong');
    const coordinates = document.createElement('small');
    const name = params.get('name') || (params.get('mp_id') ? `TMP ${params.get('mp_id')}` : '分享位置');
    const server = params.get('server');
    title.textContent = name;
    coordinates.textContent = `${server ? `${server} · ` : ''}X ${x} · Y ${y}`;
    coordinates.style.display = 'block';
    coordinates.style.marginTop = '3px';
    label.append(title, coordinates);
    sharedLocation = { latlng: point, label };
    selectedCity = null;
    selectedMarker?.remove();
    selectedMarker = L.marker(point, {
      icon: L.divIcon({ className: 'city-dot', iconSize: [12, 12] }),
      keyboard: false,
      zIndexOffset: 1000
    }).addTo(map);
    if (params.has('heading') && Number.isFinite(heading)) {
      const length = 400;
      sharedHeadingLayer = L.polyline([point, toLatLng(x + Math.cos(heading) * length, y + Math.sin(heading) * length)], {
        color: '#34d399',
        weight: 4,
        opacity: 0.85,
        interactive: false
      }).addTo(map);
    }
    rebuildCityLabels();
    map.setView(point, zoom);
  }

  function buildRegions() {
    const fragment = document.createDocumentFragment();
    regions.forEach((region) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'region';
      button.title = region.dlc;
      button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12Z"/><circle cx="12" cy="9" r="2"/></svg>';
      const label = document.createElement('span');
      label.textContent = region.name;
      button.append(label);
      button.addEventListener('click', () => {
        if (!region.cities.length) return resetView();
        if (region.boundary) focusRegion(region);
        else selectCity(findCity(region.cities));
      });
      fragment.append(button);
    });
    $('#region-list').append(fragment);
  }

  function openPanel() {
    sidebar.classList.add('open');
    sidebar.style.transform = 'translateX(0)';
    backdrop.classList.add('visible');
    $('#panel-toggle').setAttribute('aria-expanded', 'true');
  }

  function closePanel() {
    sidebar.classList.remove('open');
    sidebar.style.transform = '';
    backdrop.classList.remove('visible');
    $('#panel-toggle').setAttribute('aria-expanded', 'false');
  }

  async function fetchJson(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }

  async function init() {
    try {
      const requestedVersion = new URLSearchParams(window.location.search).get('version') || window.ETS2_MAP_VERSION;
      const dataPrefix = /^v\d+\.\d+$/.test(requestedVersion || '') ? `./${requestedVersion}` : '.';
      [info, cities, dlcRegions, backgroundInfo] = await Promise.all([
        fetchJson(`${dataPrefix}/TileMapInfo.json?v=2`),
        fetchJson(`${dataPrefix}/Cities.json?v=3`),
        fetchJson(`${dataPrefix}/DlcRegions.json?v=3`),
        fetchJson(`${dataPrefix}/Background.json?v=1`)
      ]);
      const countryList = await fetchJson(`${dataPrefix}/Countries.json`);
      countries = new Map(countryList.map((country) => [country.CountryId, country]));
      const bounds = L.latLngBounds([-512, 0], [0, 512]);

      map = L.map('map', {
        crs: L.CRS.Simple,
        minZoom: info.minZoom,
        maxZoom: info.maxZoom,
        maxBounds: bounds.pad(0.08),
        maxBoundsViscosity: 0.9,
        zoomControl: false,
        attributionControl: true,
        zoomSnap: 1,
        zoomDelta: 1,
        preferCanvas: true
      });
      map.attributionControl.setPrefix(false).addAttribution('地图数据 © SCS Software · <a href="https://github.com/dariowouters/ts-map" target="_blank" rel="noreferrer">TsMap</a> · Leaflet');
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      map.createPane('gameBackground');
      map.getPane('gameBackground').style.zIndex = '150';
      map.getPane('gameBackground').style.pointerEvents = 'none';
      backgroundLayer = L.imageOverlay(`${dataPrefix}/Background.png?v=1`, backgroundInfo.bounds, {
        pane: 'gameBackground',
        opacity: 0.28,
        interactive: false
      }).addTo(map);
      const tileSource = new URLSearchParams(window.location.search).get('tiles') === 'tmp_s1' ? 'tmp_s1' : 'ets';
      L.tileLayer(`${dataPrefix}/${tileSource}/{z}/{x}/{y}.png?v=3`, {
        tileSize: 512,
        bounds,
        minZoom: info.minZoom,
        maxZoom: info.maxZoom,
        noWrap: true,
        keepBuffer: 4,
        updateWhenIdle: false
      }).addTo(map);
      map.fitBounds(bounds, { padding: [0, 0] });
      map.on('moveend', rebuildCityLabels);

      cities.forEach((city) => {
        const country = countries.get(city.CountryId);
        city.searchText = normalize([
          city.Name,
          ...Object.values(city.LocalizedNames || {}),
          country?.Name,
          ...Object.values(country?.LocalizedNames || {})
        ].join(' '));
      });
      $('#city-count').textContent = cities.length;
      buildLocaleOptions();
      buildDlcBoundaries();
      buildRegions();
      rebuildCityLayer();
      rebuildCityLabels();
      showSharedLocation();
      loading.hidden = true;
    } catch (error) {
      loading.hidden = true;
      errorPanel.hidden = false;
      $('#error-message').textContent = `${error.message}。请通过项目服务器访问，不要直接双击 HTML 文件。`;
    }
  }

  searchInput.addEventListener('input', renderResults);
  searchInput.addEventListener('focus', renderResults);
  localeSelect.addEventListener('change', () => {
    rebuildCityLayer();
    rebuildCityLabels();
    if (selectedCity) searchInput.value = cityName(selectedCity);
    renderResults();
  });
  cityToggle.addEventListener('change', () => {
    if (cityToggle.checked) allCityLayer.addTo(map);
    else allCityLayer.remove();
  });
  dlcBoundaryToggle.addEventListener('change', () => {
    if (dlcBoundaryToggle.checked) dlcBoundaryLayer.addTo(map);
    else dlcBoundaryLayer.remove();
  });
  backgroundToggle.addEventListener('change', () => {
    if (backgroundToggle.checked) backgroundLayer.addTo(map);
    else backgroundLayer.remove();
  });
  $('#reset-view').addEventListener('click', resetView);
  const panelToggle = $('#panel-toggle');
  const handlePanelToggle = (event) => {
    event.preventDefault();
    event.stopPropagation();
    openPanel();
  };
  panelToggle.addEventListener('pointerdown', handlePanelToggle);
  panelToggle.addEventListener('click', handlePanelToggle);
  $('#panel-close').addEventListener('pointerdown', closePanel);
  $('#panel-close').addEventListener('click', closePanel);
  backdrop.addEventListener('pointerdown', closePanel);
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.search-section')) resultsPanel.classList.remove('visible');
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === '/' && !event.target.matches('input, select, textarea')) {
      event.preventDefault();
      if (window.innerWidth <= 700) openPanel();
      searchInput.focus();
    }
    if (event.key === 'Escape') {
      resultsPanel.classList.remove('visible');
      closePanel();
    }
  });

  init();
})();
