export type Options = {
    enabled: boolean
    tracingEnabled: boolean
    loggingEnabled: boolean
    metricsEnabled: boolean
    enabledOn: string[]
    traceCollectorUrl: string
    logCollectorUrl: string
    metricsCollectorUrl: string
    headers: Record<string, string>
    concurrencyLimit: number
    events: (keyof HTMLElementEventMap)[]
    propagateTo: string[]
    instrumentations: ('fetch' | 'load' | 'interaction')[]
    traceExportErrors?: string[]
    logExportErrors?: string[]
    metricExportErrors?: string[]
}

export const defaultOptions: Options = {
    enabled: true,
    tracingEnabled: true,
    loggingEnabled: true,
    metricsEnabled: true,
    enabledOn: ['http://localhost/*'],
    traceCollectorUrl: 'http://localhost:4318/v1/traces',
    logCollectorUrl: 'http://localhost:4318/v1/logs',
    metricsCollectorUrl: 'http://localhost:4318/v1/metrics',
    headers: {},
    concurrencyLimit: 10,
    events: ['submit', 'click', 'keypress', 'scroll', 'resize', 'contextmenu', 'drag', 'cut', 'copy', 'input', 'pointerdown', 'pointerenter', 'pointerleave'],
    propagateTo: [],
    instrumentations: ['fetch', 'load', 'interaction'],
}