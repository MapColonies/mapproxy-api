import { Span, Tracer } from '@opentelemetry/api';

const setStatusMock = jest.fn();
const recordExceptionMock = jest.fn();
const endMock = jest.fn();

const spanMock = {
  setStatus: setStatusMock,
  recordException: recordExceptionMock,
  end: endMock,
} as unknown as Span;

const startSpanMock = jest.fn().mockReturnValue(spanMock);
const startActiveSpanMock = jest.fn();

const tracerMock = {
  startSpan: startSpanMock,
  startActiveSpan: startActiveSpanMock,
} as unknown as Tracer;

export { tracerMock, startSpanMock, startActiveSpanMock, spanMock, setStatusMock, recordExceptionMock, endMock };
