import otel from '@opentelemetry/api';

const tracer = otel.trace.getTracer('dice-lib');
const meter = otel.metrics.getMeter('dice-lib');
const counter = meter.createCounter('dice.rolls');

function rollOnce(it: number, min: number, max: number) {
  return tracer.startActiveSpan(`rollOnce:${it}`, span => {
    counter.add(1);
    const result = Math.floor(Math.random() * (max - min + 1) + min);
    span.setAttribute('roll.result', result);
    span.end();
    return result;
  });
}

export function rollTheDice(rolls: number, min: number, max: number) {
  return tracer.startActiveSpan('rollTheDice', span => {
    const result: number[] = [];
    for (let i = 0; i < rolls; i++) {
      result.push(rollOnce(i, min, max));
    }
    span.end();
    return result;
  });
}
