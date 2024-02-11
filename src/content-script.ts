import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { BatchSpanProcessor, ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { Resource } from '@opentelemetry/resources';
import { B3Propagator } from '@opentelemetry/propagator-b3';
import { CompositePropagator, W3CTraceContextPropagator } from '@opentelemetry/core';

import { config as appConfig } from "~config";

export type Options = {
    url: string
    headers: Record<string, string>
    concurrencyLimit: number
    events: (keyof HTMLElementEventMap)[]
    telemetry: ('logs' | 'traces')[],
    propagateTo: string[],
    instrumentations: ('fetch' | 'load' | 'interaction')[],
    enabled: boolean,
}

const instrument = (options: Options) => {

    console.debug('instrumenting with options', options)

    if (!options.enabled || options.instrumentations.length === 0) {
        return () => { }
    }

    const resource = new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'opentelemetry-browser-extension',
        [SemanticResourceAttributes.SERVICE_VERSION]: '0.0.1',
        [SemanticResourceAttributes.TELEMETRY_SDK_LANGUAGE]: 'webjs',
        [SemanticResourceAttributes.TELEMETRY_SDK_NAME]: 'opentelemetry',
        [SemanticResourceAttributes.TELEMETRY_SDK_VERSION]: '1.19.0',
        'browser.language': navigator.language,
        'user_agent.original': navigator.userAgent,
        'extension.target': process.env.PLASMO_TARGET,
    })
    const provider = new WebTracerProvider({
        resource,
    });
    // #TODO: make console configurable
    // const consoleExporter = new ConsoleSpanExporter();
    const traceExporter = new OTLPTraceExporter({
        url: options.url,
        headers: options.headers,
        concurrencyLimit: options.concurrencyLimit,
    });
    // #TODO: instrument console logs
    // const log = new OTLPLogExporter({
    //     url: options.url,
    //     headers: options.headers,
    //     concurrencyLimit: options.concurrencyLimit,
    // });
    const traceProcessor = new BatchSpanProcessor(traceExporter);
    // const consoleProcessor = new SimpleSpanProcessor(consoleExporter);
    // provider.addSpanProcessor(consoleProcessor);
    provider.addSpanProcessor(traceProcessor);
    provider.register({
        contextManager: new ZoneContextManager(),
        propagator: new CompositePropagator({
            propagators: options.propagateTo.length > 0 ? [
                new B3Propagator(),
                new W3CTraceContextPropagator(),
            ] : [],
        }),
    });
    const propagateTraceHeaderCorsUrls = options.propagateTo.map((url) => new RegExp(url))
    const clearTimingResources = true
    const instrumentations = {
        load: [
            ['@opentelemetry/instrumentation-document-load', {}]
        ],
        fetch: [
            ['@opentelemetry/instrumentation-xml-http-request', {
                clearTimingResources,
                propagateTraceHeaderCorsUrls
            }],
            ['@opentelemetry/instrumentation-fetch', {
                clearTimingResources,
                propagateTraceHeaderCorsUrls
            }]
        ],
        interaction: [
            ['@opentelemetry/instrumentation-user-interaction', {
                eventNames: options.events,
            }]
        ],
    }
    const instrumentationsToRegister = {}
    options.instrumentations.forEach((instrumentation: string) => {
        instrumentations[instrumentation].forEach((setting) => {
            instrumentationsToRegister[setting[0]] = setting[1]
        })
    })

    return registerInstrumentations({
        instrumentations: [
            getWebAutoInstrumentations(instrumentationsToRegister),
        ],
        tracerProvider: provider,
    });
}

function injectContentScript(extensionId: string, options: Options) {
    const port = chrome.runtime.connect(extensionId);
    let deregisterInstrumentation = instrument(options);

    port.onDisconnect.addListener(obj => {
        console.debug('disconnected port', obj);
        deregisterInstrumentation && deregisterInstrumentation()
        port.disconnect()
    })

    port.onMessage.addListener((m) => {
        console.debug("in content script, received message from background script", m);
        options = {
            ...options,
            ...m
        }
        deregisterInstrumentation && deregisterInstrumentation()
        deregisterInstrumentation = instrument(options)
    });
}

export default injectContentScript;