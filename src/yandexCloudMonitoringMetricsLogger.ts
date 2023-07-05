import { Session, serviceClients } from '@yandex-cloud/nodejs-sdk';
import axios, { AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import { IYandexMetricRequest, IYandexMetricResponse } from './types';

const MAX_RETRIES = 3;
axiosRetry(axios, {
  retries: MAX_RETRIES,
});

export interface IYandexCloudMonitoringMetricsLogger {
  writeMetrics(metrics: IYandexMetricRequest): Promise<IYandexMetricResponse>;
}

export class YandexCloudMonitoringMetricsLogger
  implements IYandexCloudMonitoringMetricsLogger
{
  private readonly serviceAccountId: string;
  private readonly folderId: string;
  private readonly session: Session;
  private iamToken: string | null = null;

  constructor(
    serviceAccountId: string,
    accessKeyId: string,
    privateKey: string,
    folderId: string
  ) {
    this.serviceAccountId = serviceAccountId;
    this.folderId = folderId;
    this.session = new Session({
      serviceAccountJson: {
        serviceAccountId,
        accessKeyId,
        privateKey,
      },
    });
  }

  private async refreshToken(): Promise<void> {
    this.iamToken = null;
    const iamTokenServiceClient = this.session.client(
      serviceClients.IamTokenServiceClient
    );

    const token = await iamTokenServiceClient.createForServiceAccount({
      $type: 'yandex.cloud.iam.v1.CreateIamTokenForServiceAccountRequest',
      serviceAccountId: this.serviceAccountId,
    });

    this.iamToken = token.iamToken;
  }

  private getFailedToRefreshTokenResponse(): IYandexMetricResponse {
    return {
      writtenMetricsCount: 0,
      error: 'Failed to refresh IAM token',
    };
  }

  async writeMetrics(
    metrics: IYandexMetricRequest
  ): Promise<IYandexMetricResponse> {
    try {
      if (!this.iamToken) {
        await this.refreshToken();
        if (!this.iamToken) {
          return this.getFailedToRefreshTokenResponse();
        }
      }

      const response = await axios.post(
        'https://monitoring.api.cloud.yandex.net/monitoring/v2/data/write',
        metrics,
        {
          headers: {
            Authorization: `Bearer ${this.iamToken}`,
          },
          params: {
            service: 'custom',
            folderId: this.folderId,
          },
        }
      );

      if (response.status === 200) {
        const { writtenMetricsCount } = response.data;
        return {
          writtenMetricsCount,
        };
      }

      if (response.status === 401) {
        await this.refreshToken();
        if (!this.iamToken) {
          return this.getFailedToRefreshTokenResponse();
        }

        return await this.writeMetrics(metrics);
      }

      return {
        writtenMetricsCount: 0,
        error: response.statusText,
      };
    } catch (error) {
      if ((error as AxiosError).response?.status === 401) {
        await this.refreshToken();
        if (!this.iamToken) {
          return this.getFailedToRefreshTokenResponse();
        }

        return await this.writeMetrics(metrics);
      }

      return {
        writtenMetricsCount: 0,
        error: (error as AxiosError).message,
      };
    }
  }
}
