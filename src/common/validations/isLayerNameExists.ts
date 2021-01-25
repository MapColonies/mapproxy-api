import { IMapProxyJsonDocument } from '../interfaces';

export function isLayerNameExists(jsonDocument: IMapProxyJsonDocument, layerName: string): boolean {
  try {
    const publishedLayers: string[] = Object.keys(jsonDocument.caches);
    return publishedLayers.includes(layerName);
  } catch (error) {
    throw new Error(error);
  }
}
