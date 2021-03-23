class Config {
    constructor(private values: Record<string, string>) {}

    private keyDefined(key: string): boolean {
        return key in this.values
    }

    private getValue(key: string): string {
        return this.values[key]
    }

    public get(key: string): string {
        if (this.keyDefined(key)) {
            return this.getValue(key)
        } else {
            throw new Error(`Unknown configuration: ${key}`)
        }
    }
}

class ConfigBuilder {
    public variables: Record<string, string> = {}

    public build(): Config {
        return new Config(this.variables)
    }

    public addValue(key: string, value: string): this {
        if (value === undefined) {
            throw new Error(`Failed to add "${key}" property. The value cannot be undefined`)
        }
        if (key in this.variables) {
            throw new Error(`"${key}" already has a value defined.`)
        }
        this.variables[key] = value
        return this
    }

    public addValueWithDefault(key: string, value: string, defaultValue: string): this {
        if (defaultValue === undefined) {
            throw new Error(`Failed to add "${key}" property. Default value cannot be undefined`)
        }
        return this.addValue(key, value === undefined ? defaultValue : value)
    }
}

export const config = new ConfigBuilder().addValue('NETWORK', process.env.NETWORK || 'mainnet').build()
