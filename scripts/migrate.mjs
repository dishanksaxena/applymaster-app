#!/usr/bin/env node
/**
 * Apply SQL migrations to the Supabase database.
 *
 *   node scripts/migrate.mjs supabase/migrations/add_ops_tracking.sql
 *   node scripts/migrate.mjs --check          # connect and report, change nothing
 *
 * Reads DATABASE_URL from the environment or .env.local — the Postgres
 * connection string from Supabase → Project Settings → Database. Each file
 * runs inside a transaction, so a failure part-way through changes nothing.
 * Migrations here are written to be safe to re-run.
 */
import { readFileSync, existsSync } from 'node:fs'
import pg from 'pg'

function env(name) {
  if (process.env[name]) return process.env[name]
  if (!existsSync('.env.local')) return undefined
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && m[1] === name) return m[2].replace(/^["']|["']$/g, '')
  }
}

const url = env('DATABASE_URL')
if (!url) {
  console.error('DATABASE_URL is not set (environment or .env.local).')
  process.exit(1)
}

const args = process.argv.slice(2)
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await client.connect()

try {
  const { rows } = await client.query('select current_database() as db, version() as v')
  console.log(`connected: ${rows[0].db} (${rows[0].v.split(',')[0]})`)
  if (args.includes('--check') || args.length === 0) process.exit(0)

  for (const file of args) {
    const sql = readFileSync(file, 'utf8')
    process.stdout.write(`applying ${file} … `)
    try {
      await client.query('begin')
      await client.query(sql)
      await client.query('commit')
      console.log('ok')
    } catch (err) {
      await client.query('rollback').catch(() => {})
      console.log('FAILED')
      console.error(`  ${err.message}`)
      process.exitCode = 1
      break
    }
  }
  // Make PostgREST see new tables immediately rather than after its cache expires.
  await client.query(`notify pgrst, 'reload schema'`).catch(() => {})
} finally {
  await client.end()
}
