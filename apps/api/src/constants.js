export const APP_NAME = 'LockerHub'

/** @type {NodeJS.ProcessEnv} */
const env = Object.assign(Object.create(null), process.env)

/**
 * @param {string} name
 */
export const fromEnv = name => env[name]
