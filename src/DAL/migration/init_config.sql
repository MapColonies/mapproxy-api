-- Do not forget - update the bucket-name value + take the current json initial data from file mapproxy_init.json

SET search_path TO "MapproxyConfig", public;-- CHANGE SCHEMA NAME TO MATCH ENVIRONMENT
-- Table: config
-- DROP TABLE config;

insert into config values(DEFAULT,'{
    "grids": {
      "WorldCRS84": {
        "srs": "EPSG:4326",
        "bbox": [
          -180,
          -90,
          180,
          90
        ],
        "origin": "ll",
        "min_res": 0.703125,
        "num_levels": 21
      },
      "webmercator": {
        "base": "GLOBAL_WEBMERCATOR"
      }
    },
    "caches": {
      "osm_cache": {
        "grids": [
          "webmercator"
        ],
        "sources": [
          "osm_wms"
        ]
      }
    },
    "layers": [
      {
        "name": "osm",
        "title": "Omniscale OSM WMS - osm.omniscale.net",
        "sources": [
          "osm_cache"
        ]
      }
    ],
    "globals": {
      "cache": {
        "base_dir": "/mapproxy/cache_data",
        "lock_dir": "/mapproxy/cache_data/locks",
        "tile_lock_dir": "/mapproxy/cache_data/tile_locks"
      },
      "image": {
        "format": {
          "image/png": {
            "resampling_method": "nearest"
          },
          "image/jpeg": {
            "encoding_options": {
              "jpeg_quality": 75
            },
            "resampling_method": "nearest"
          }
        },
        "paletted": false
      }
    },
    "sources": {
      "osm_wms": {
        "req": {
          "url": "https://maps.omniscale.net/v2/demo/style.default/service?",
          "layers": "osm"
        },
        "type": "wms"
      },
      "timeout_wms": {
        "url": "https://time-out-raster-dev.apps.j1lk3njp.eastus.aroapp.io/wms",
        "grid": "WorldCRS84",
        "type": "tile"
      }
    },
    "services": {
      "kml": {
        "use_grid_names": true
      },
      "tms": {
        "origin": "nw",
        "use_grid_names": true
      },
      "wms": {
        "md": {
          "title": "MapProxy WMS Proxy",
          "abstract": "This is a minimal MapProxy example."
        }
      },
      "demo": null,
      "wmts": null
    }
  }',DEFAULT);