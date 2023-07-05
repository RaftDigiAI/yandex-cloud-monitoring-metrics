# yandex-cloud-monitoring-metrics

A library for sending metrics to yandex cloud monitoring.

API doc https://cloud.yandex.com/en/docs/monitoring/operations/metric/add.

## Supported metric types

1. DGAUGE Numeric value (decimal). It shows the metric value at a certain point in time. For example, the amount of used RAM.
2. GAUGE Numeric value (integer). It shows the metric value at a certain point in time.
3. COUNTER Counter. It shows the metric value that increases over time. For example, the number of days of service continuous running.
4. RATE Derivative value. It shows the change in the metric value over time. For example, the number of requests per second.

## Getting started

1. Get the ID of the folder for which you are granted the monitoring.editor role or a higher role (https://cloud.yandex.com/en/docs/resource-manager/operations/folder/get-id)
2. Create a service account https://cloud.yandex.com/en-ru/docs/iam/concepts/users/service-accounts with monitoring.writer permission
3. Store the service account ID, access key ID and private key

## Install

```bash
npm install yandex-cloud-monitoring-metrics
```

## Usage

```ts
const metricsLogger = new YandexCloudMonitoringMetricsLogger(
  process.env.SERVICE_ACCOUNT_ID,
  process.env.ACCESS_KEY_ID,
  process.env.PRIVATE_KEY,
  process.env.FOLDER_ID
);

const metrics: IYandexMetricRequest = {
  metrics: [
    {
      name: 'performance.metric',
      type: YandexMetricType.GAUGE,
      value: 150,
      labels: {
        env: 'production',
        tag1: 'value1',
      },
    },
  ],
};

const { writtenMetricsCount, error } = await metricsLogger.writeMetrics(
  metrics
);
```
