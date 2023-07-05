export enum YandexMetricType {
  DGAUGE = 'DGAUGE',
  GAUGE = 'GAUGE',
  COUNTER = 'COUNTER',
  RATE = 'RATE',
}

export interface IYandexMetric {
  name: string;
  labels: Record<string, string>;
  type: YandexMetricType;
  value: number;
}

export interface IYandexMetricRequest {
  metrics: IYandexMetric[];
}

export interface IYandexMetricResponse {
  writtenMetricsCount: number;
  error?: string;
}
