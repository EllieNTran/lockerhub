export const APP_NAME = 'LockerHub Auth'

const env: NodeJS.ProcessEnv = Object.assign(Object.create(null), process.env)

export const fromEnv = (name: string): string | undefined => env[name]
