import { IMapProxyJsonDocument } from '../interfaces';

export function isLayerNameExists(jsonDocument: IMapProxyJsonDocument, layerName: string): boolean {
  const layer = jsonDocument.layers.find(layer => layer.name.includes(layerName));
  return layer ? true : false;
}
