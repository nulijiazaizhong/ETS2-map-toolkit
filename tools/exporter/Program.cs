using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using TsMap;

namespace TsMapExporter
{
    internal sealed class Palette : MapPalette
    {
        public Palette()
        {
            Background = Brushes.Transparent;
            Road = new SolidBrush(Color.FromArgb(226, 232, 240));
            PrefabRoad = Road;
            PrefabLight = new SolidBrush(Color.FromArgb(251, 191, 36));
            PrefabDark = new SolidBrush(Color.FromArgb(217, 119, 6));
            PrefabGreen = new SolidBrush(Color.FromArgb(52, 211, 153));
            CityName = new SolidBrush(Color.FromArgb(248, 250, 252));
            FerryLines = new SolidBrush(Color.FromArgb(140, 56, 189, 248));
            Error = Brushes.LightCoral;
        }
    }

    internal static class Program
    {
        private const int TileSize = 512;
        private const int MapPadding = 500;

        private static void Main(string[] args)
        {
            if (args.Length < 2)
            {
                Console.Error.WriteLine("Usage: TsMapExporter.exe <game-dir> <output-dir> [max-zoom=8] [tile-dir=ets] [mods-dir ...]");
                Environment.Exit(2);
            }

            var gameDir = Path.GetFullPath(args[0]);
            var outputDir = Path.GetFullPath(args[1]);
            var maxZoom = args.Length >= 3 ? int.Parse(args[2]) : 8;
            var tileDir = args.Length >= 4 ? args[3] : "ets";
            var modsDirs = args.Skip(4).Select(path => Path.GetFullPath(path)).ToArray();
            if (!Directory.Exists(gameDir) || maxZoom < 0 || maxZoom > 12 ||
                string.IsNullOrWhiteSpace(tileDir) || Path.GetFileName(tileDir) != tileDir || tileDir == "." || tileDir == ".." ||
                modsDirs.Any(path => !Directory.Exists(path)))
            {
                Console.Error.WriteLine("Invalid game directory, zoom level, tile directory, or mods directory.");
                Environment.Exit(2);
            }

            var mods = modsDirs.SelectMany(path => Directory.GetFiles(path))
                .Where(path => new[] { ".mp", ".scs", ".zip" }.Contains(Path.GetExtension(path).ToLowerInvariant()))
                .OrderBy(path => path, StringComparer.Ordinal).Select(path => new Mod(path) { Load = true }).ToList();
            if (modsDirs.Length > 0 && mods.Count == 0) throw new InvalidOperationException("No supported mods were found.");
            Console.WriteLine($"Loading {mods.Count} mod archives into {tileDir}.");

            Directory.CreateDirectory(outputDir);
            Environment.CurrentDirectory = Path.GetDirectoryName(typeof(Program).Assembly.Location);
            var mapper = new TsMapper(gameDir, mods);
            mapper.Parse();
            if (mapper.Cities.Count == 0) throw new InvalidOperationException("No map cities were loaded.");

            mapper.ExportInfo(ExportFlags.All, outputDir);
            var renderer = new TsMapRenderer(mapper);
            var palette = new Palette();
            GetMapFrame(mapper, TileSize, TileSize, out var origin, out _);
            JsonHelper.SaveTileMapInfo(outputDir, origin.X, origin.X + TileSize / GetMapFrameScale(mapper),
                origin.Y, origin.Y + TileSize / GetMapFrameScale(mapper), 0, maxZoom);

            for (var z = 0; z <= maxZoom; z++)
            {
                var dimension = 1 << z;
                GetMapFrame(mapper, dimension * TileSize, dimension * TileSize, out origin, out var zoom);
                for (var x = 0; x < dimension; x++)
                {
                    var directory = Path.Combine(outputDir, tileDir, z.ToString(), x.ToString());
                    Directory.CreateDirectory(directory);
                    for (var y = 0; y < dimension; y++)
                    {
                        var tilePath = Path.Combine(directory, y + ".png");
                        if (File.Exists(tilePath) && new FileInfo(tilePath).Length > 0) continue;
                        var position = new PointF(origin.X + x * TileSize / zoom, origin.Y + y * TileSize / zoom);
                        using (var bitmap = new Bitmap(TileSize, TileSize, PixelFormat.Format32bppArgb))
                        using (var graphics = Graphics.FromImage(bitmap))
                        {
                            renderer.Render(graphics, new Rectangle(0, 0, TileSize, TileSize), zoom, position,
                                palette, RenderFlags.All & ~RenderFlags.TextOverlay & ~RenderFlags.CityNames);
                            bitmap.Save(tilePath, ImageFormat.Png);
                        }
                    }
                }
                Console.WriteLine($"Generated zoom {z}: {dimension * dimension} tiles");
            }
            Console.WriteLine($"Exported {mapper.Cities.Count} cities and zoom levels 0-{maxZoom} to {outputDir}");
        }

        private static float GetMapFrameScale(TsMapper mapper)
        {
            var mapWidth = mapper.maxX - mapper.minX + MapPadding * 2;
            var mapHeight = mapper.maxZ - mapper.minZ + MapPadding * 2;
            return TileSize / Math.Max(mapWidth, mapHeight);
        }

        private static void GetMapFrame(TsMapper mapper, float width, float height, out PointF origin, out float zoom)
        {
            var mapWidth = mapper.maxX - mapper.minX + MapPadding * 2;
            var mapHeight = mapper.maxZ - mapper.minZ + MapPadding * 2;
            zoom = Math.Min(width / mapWidth, height / mapHeight);
            origin = new PointF(
                mapper.minX - MapPadding - (width / zoom - mapWidth) / 2f,
                mapper.minZ - MapPadding - (height / zoom - mapHeight) / 2f);
        }
    }
}
