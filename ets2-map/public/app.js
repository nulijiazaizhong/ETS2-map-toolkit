(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const loading = $('#loading');
  const errorPanel = $('#error');
  const searchInput = $('#search');
  const resultsPanel = $('#search-results');
  const localeSelect = $('#locale');
  const gameSelect = $('#game');
  const basemapSelect = $('#basemap');
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

  const atsRegions = [
    { name: '美国全图', dlc: '全部区域', cities: [] },
    { name: '基础地图', dlc: 'Base map', archive: 'base_map.scs', cities: ['Los Angeles', 'San Francisco'] },
    { name: '亚利桑那', dlc: 'Arizona', archive: 'dlc_arizona.scs', cities: ['Phoenix', 'Tucson'] },
    { name: '新墨西哥', dlc: 'New Mexico', archive: 'dlc_nm.scs', cities: ['Albuquerque', 'Santa Fe'] },
    { name: '俄勒冈', dlc: 'Oregon', archive: 'dlc_or.scs', cities: ['Portland', 'Eugene'] },
    { name: '华盛顿', dlc: 'Washington', archive: 'dlc_wa.scs', cities: ['Seattle', 'Olympia'] },
    { name: '犹他', dlc: 'Utah', archive: 'dlc_ut.scs', cities: ['Salt Lake City', 'Provo'] },
    { name: '爱达荷', dlc: 'Idaho', archive: 'dlc_id.scs', cities: ['Boise', 'Idaho Falls'] },
    { name: '科罗拉多', dlc: 'Colorado', archive: 'dlc_co.scs', cities: ['Denver', 'Colorado Springs'] },
    { name: '怀俄明', dlc: 'Wyoming', archive: 'dlc_wy.scs', cities: ['Cheyenne', 'Casper'] },
    { name: '蒙大拿', dlc: 'Montana', archive: 'dlc_mt.scs', cities: ['Billings', 'Helena'] },
    { name: '得克萨斯', dlc: 'Texas', archive: 'dlc_tx.scs', cities: ['Houston', 'Dallas'] },
    { name: '俄克拉何马', dlc: 'Oklahoma', archive: 'dlc_ok.scs', cities: ['Oklahoma City', 'Tulsa'] },
    { name: '堪萨斯', dlc: 'Kansas', archive: 'dlc_ks.scs', cities: ['Topeka', 'Wichita'] },
    { name: '内布拉斯加', dlc: 'Nebraska', archive: 'dlc_ne.scs', cities: ['Lincoln', 'Omaha'] },
    { name: '密苏里', dlc: 'Missouri', archive: 'dlc_mo.scs', cities: ['Kansas City', 'St. Louis'] },
    { name: '阿肯色', dlc: 'Arkansas', archive: 'dlc_ar.scs', cities: ['Little Rock', 'Fort Smith'] },
    { name: '路易斯安那', dlc: 'Louisiana', archive: 'dlc_la.scs', cities: ['New Orleans', 'Baton Rouge'] },
    { name: '艾奥瓦', dlc: 'Iowa', archive: 'dlc_ia.scs', cities: ['Des Moines', 'Cedar Rapids'] },
    { name: '伊利诺伊', dlc: 'Illinois', archive: 'dlc_il.scs', cities: ['Chicago', 'Springfield'] },
    { name: '南达科他', dlc: 'South Dakota', archive: 'dlc_sd.scs', cities: ['Sioux Falls', 'Rapid City'] },
    { name: '内华达', dlc: 'Nevada', archive: 'dlc_nevada.scs', cities: ['Las Vegas', 'Reno'] },
    { name: 'ProMods 加拿大', dlc: 'ProMods', cities: ['Vancouver'] }
  ];
  const regionsByGame = { ETS2: regions, ATS: atsRegions };
  const defaultSources = { ETS2: 'Europe', ATS: 'American' };
  const sourceOptions = {
    ETS2: [
      ['Europe', 'ETS2-原版'],
      ['TMP', 'ETS2-TMP-S1'],
      ['Europe_Promods', 'ETS2-Promods'],
      ['TMP_Promods', 'ETS2-TMP-Promods']
    ],
    ATS: [
      ['American', 'ATS-原版'],
      ['TMP', 'ATS-TMP-S1'],
      ['American_Promods', 'ATS-Promods'],
      ['TMP_Promods', 'ATS-TMP-Promods']
    ]
  };

  let currentGame = 'ETS2';
  let map;
  let info;
  let cities = [];
  let dlcRegions = [];
  let backgroundInfo;
  let backgroundLayer;
  let tileLayer;
  let dataPrefix;
  let mapManifest;
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
    if (dlcBoundaryLayer) dlcBoundaryLayer.remove();
    const colors = ['#38bdf8', '#f59e0b', '#34d399', '#a78bfa', '#f472b6', '#60a5fa', '#f97316', '#2dd4bf', '#e879f9', '#fbbf24', '#818cf8', '#22d3ee'];
    const layers = [];
    regionsByGame[currentGame].forEach((region, index) => {
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
    if (dlcBoundaryToggle.checked && layers.length) dlcBoundaryLayer.addTo(map);
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
    $('#region-list').replaceChildren();
    regionsByGame[currentGame].forEach((region) => {
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

  async function fetchGameData(game, source) {
    const metadataPath = `${dataPrefix}/${game}/metadata/${source}`;
    const [mapInfo, cityList, countryList, manifest] = await Promise.all([
      fetchJson(`${metadataPath}/TileMapInfo.json?v=2`),
      fetchJson(`${metadataPath}/Cities.json?v=3`),
      fetchJson(`${metadataPath}/Countries.json`),
      fetchJson(`${dataPrefix}/${game}/map-manifest.json?v=1`)
    ]);
    const [regionsData, background] = await Promise.all([
      fetchJson(`${dataPrefix}/${game}/metadata/${source}/DlcRegions.json?v=3`),
      fetchJson(`${dataPrefix}/${game}/metadata/${source}/Background.json?v=1`)
    ]);
    return { mapInfo, cityList, countryList, manifest, regionsData, background, source };
  }

  function applyGameData(data) {
    [allCityLayer, cityLabelLayer, dlcBoundaryLayer, backgroundLayer, tileLayer, selectedLabel, selectedMarker, sharedHeadingLayer]
      .forEach((layer) => layer?.remove());
    selectedMarker = null;
    selectedLabel = null;
    selectedCity = null;
    sharedLocation = null;
    resultsPanel.classList.remove('visible');
    searchInput.value = '';
    info = data.mapInfo;
    cities = data.cityList;
    countries = new Map(data.countryList.map((country) => [country.CountryId, country]));
    dlcRegions = data.regionsData;
    backgroundInfo = data.background;
    mapManifest = data.manifest;
    const availableSources = new Set(mapManifest.sources);
    const source = availableSources.has(data.source) ? data.source : mapManifest.sources[0];
    if (!source) throw new Error('地图清单中没有可用的底图数据');
    const bounds = L.latLngBounds([-512, 0], [0, 512]);

    if (!map) {
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
      map.on('moveend', rebuildCityLabels);
    }
    if (backgroundInfo) {
      backgroundLayer = L.imageOverlay(`${dataPrefix}/${currentGame}/metadata/${source}/Background.png?v=1`, backgroundInfo.bounds, {
        pane: 'gameBackground',
        opacity: 0.28,
        interactive: false
      }).addTo(map);
    }
    basemapSelect.replaceChildren(...sourceOptions[currentGame].map(([value, label]) => new Option(label, value)));
    for (const option of basemapSelect.options) {
      const label = option.dataset.label || option.textContent;
      option.dataset.label = label;
      option.disabled = !availableSources.has(option.value);
      option.textContent = option.disabled ? `${label}（暂无数据）` : label;
    }
    basemapSelect.value = source;
    basemapSelect.disabled = false;
    tileLayer = L.tileLayer(`${dataPrefix}/${currentGame}/${source}/{z}/{x}/{y}.png?v=3`, {
      tileSize: 512,
      bounds,
      minZoom: info.minZoom,
      maxZoom: info.maxZoom,
      noWrap: true,
      keepBuffer: 4,
      updateWhenIdle: false
    }).addTo(map);
    map.fitBounds(bounds, { padding: [0, 0] });

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
    $('#dlc-count').textContent = currentGame === 'ATS' ? 21 : 12;
    $('.eyebrow').textContent = currentGame === 'ATS' ? 'AMERICAN TRUCK SIMULATOR' : 'EURO TRUCK SIMULATOR 2';
    $('h1').textContent = currentGame === 'ATS' ? '美国全图' : '欧洲全图';
    $('#map').setAttribute('aria-label', currentGame === 'ATS' ? '美国卡车模拟互动地图' : '欧洲卡车模拟2互动地图');
    document.title = currentGame === 'ATS' ? 'ATS 全 DLC 地图' : 'ETS2 全 DLC 地图';
    dlcBoundaryToggle.closest('label').hidden = dlcRegions.length === 0;
    backgroundToggle.closest('label').hidden = !backgroundInfo;
    buildLocaleOptions();
    buildDlcBoundaries();
    buildRegions();
    rebuildCityLayer();
    rebuildCityLabels();
    return source;
  }

  async function loadGameData(game, source, showLocation = false) {
    loading.hidden = false;
    errorPanel.hidden = true;
    try {
      const data = await fetchGameData(game, source);
      const selectedSource = applyGameData(data);
      if (showLocation) showSharedLocation();
      return selectedSource;
    } catch (error) {
      errorPanel.hidden = false;
      $('#error-message').textContent = `${error.message}。请通过项目服务器访问，不要直接双击 HTML 文件。`;
      return null;
    } finally {
      loading.hidden = true;
    }
  }

  function syncUrl(source) {
    const url = new URL(window.location.href);
    if (currentGame === 'ATS') url.searchParams.set('game', 'ATS');
    else url.searchParams.delete('game');
    if (source === defaultSources[currentGame]) url.searchParams.delete('tiles');
    else url.searchParams.set('tiles', source);
    for (const key of ['x', 'y', 'heading', 'zoom']) url.searchParams.delete(key);
    window.history.replaceState(null, '', url);
  }

  async function init() {
    const requestedVersion = new URLSearchParams(window.location.search).get('version') || window.ETS2_MAP_VERSION || '1.62';
    dataPrefix = /^\d+\.\d+$/.test(requestedVersion || '') ? `./${requestedVersion}` : '.';
    const params = new URLSearchParams(window.location.search);
    currentGame = params.get('game') === 'ATS' ? 'ATS' : 'ETS2';
    gameSelect.value = currentGame;
    await loadGameData(currentGame, params.get('tiles') || defaultSources[currentGame], true);
  }

  searchInput.addEventListener('input', renderResults);
  searchInput.addEventListener('focus', renderResults);
  basemapSelect.addEventListener('change', async () => {
    const source = await loadGameData(currentGame, basemapSelect.value);
    if (source) syncUrl(source);
  });
  gameSelect.addEventListener('change', async () => {
    currentGame = gameSelect.value;
    const source = await loadGameData(currentGame, defaultSources[currentGame]);
    if (source) syncUrl(source);
  });
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
    if (!backgroundLayer) return;
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
