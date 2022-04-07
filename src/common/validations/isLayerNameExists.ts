import { IMapProxyJsonDocument } from '../interfaces';

export function isLayerNameExists(jsonDocument: IMapProxyJsonDocument, layerName: string): boolean {
  const publishedLayers: string[] = Object.keys(jsonDocument.caches);
  return publishedLayers.includes(layerName);
}
