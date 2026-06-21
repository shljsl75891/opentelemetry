import {diag, DiagConsoleLogger, DiagLogLevel} from '@opentelemetry/api';
import {getNodeAutoInstrumentations} from '@opentelemetry/auto-instrumentations-node';
import {OTLPLogExporter} from '@opentelemetry/exporter-logs-otlp-proto';
import {OTLPMetricExporter} from '@opentelemetry/exporter-metrics-otlp-proto';
import {OTLPTraceExporter} from '@opentelemetry/exporter-trace-otlp-proto';
import {resourceFromAttributes} from '@opentelemetry/resources';
import {BatchLogRecordProcessor} from '@opentelemetry/sdk-logs';
import {PeriodicExportingMetricReader} from '@opentelemetry/sdk-metrics';
import {NodeSDK} from '@opentelemetry/sdk-node';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import dotenv from 'dotenv';
import {SERVICE_VERSION} from './constants';

dotenv.config();

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'roll-dicer-demo',
    [ATTR_SERVICE_VERSION]: SERVICE_VERSION,
  }),
  traceExporter: new OTLPTraceExporter(),
  metricReaders: [
    new PeriodicExportingMetricReader({exporter: new OTLPMetricExporter()}),
  ],
  logRecordProcessors: [new BatchLogRecordProcessor(new OTLPLogExporter())],
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {enabled: false},
      '@opentelemetry/instrumentation-express': {
        requestHook: (span, requestInfo) => {
          const pathParams = JSON.stringify(requestInfo.request.params);
          const queryParams = JSON.stringify(requestInfo.request.query);
          span.setAttribute('http.request.pathParams', pathParams);
          span.setAttribute('http.request.queryParams', queryParams);
        },
      },
    }),
  ],
});

sdk.start();
