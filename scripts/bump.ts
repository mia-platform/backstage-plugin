import fs from 'fs/promises'
import path from 'path'
import cp from 'child_process'

import type IPackageJson from '@ts-type/package-dts'
import { Command } from 'commander'
import semver from 'semver'

const cliName = 'bump'

const processDir = path.resolve()

const packages = ['frontend', 'backend'] as const
type Package = typeof packages[number]

const packagesCwd: Record<Package, string> = {
  frontend: path.resolve(processDir, 'packages/plugin-frontend'),
  backend: path.resolve(processDir, 'packages/plugin-backend'),
}

interface Context {
  version: string
  package: Package
  cwd: string
  packageJsonPath: string
  changelogPath: string
}

const ctx: Context = {} as Context

function execCommandSync(file: string, args: string[]) {
  try {
    cp.execFileSync(file, args, { stdio: 'inherit' })
  } catch { /* no-op */ }
}

function getArgs() {
  const program = new Command()

  program
    .name(cliName)
    .description('Bump package version')
    .argument('<package>', 'Package')
    .argument('<version>', 'Next version')
    .action((pkg: Package, version: string) => { 
      if (!packages.includes(pkg)) { throw new Error('Unrecognized package') }

      ctx.version = version 
      ctx.package = pkg
      ctx.cwd = packagesCwd[pkg]
      ctx.packageJsonPath = path.resolve(ctx.cwd, 'package.json')
      ctx.changelogPath = path.resolve(ctx.cwd, 'CHANGELOG.md')
    })
    .parse()
}

async function getPackageJson(): Promise<IPackageJson> {
  let rawPackageJson: string
  try {
    rawPackageJson = await fs.readFile(ctx.packageJsonPath, 'utf-8')
  } catch (_) {
    throw new Error(`No package.json found`)
  }

  return JSON.parse(rawPackageJson) as IPackageJson
}

function resolveNextVersion(input: string, { version: currVersion }: IPackageJson): string {
  const isSemverHint = ['major', 'minor', 'patch'].includes(input)
  if (!isSemverHint) { return input }

  if (semver.valid(currVersion) === null) {
    throw new Error('Version in package.json is not SemVer compliant')
  }

  return currVersion as string
}

async function updateChangelog(version: string) {
  if (semver.prerelease(version) !== null) { return }

  let rawChangelog: string
  try {
    rawChangelog = await fs.readFile(ctx.changelogPath, 'utf-8')
  } catch (_) {
    console.warn(`No CHANGELOG found, skipping...`)
    return
  }

  const lines = rawChangelog.toString().split(/(?:\r\n|\r|\n)/g)

  const unreleasedLine = lines.findIndex((line) =>
    line
      .trim()
      .replace(/\s/g, '')
      .toLowerCase()
      .match(/^##unreleased/)
  )

  if (unreleasedLine === -1) { return }

  const date = new Date().toISOString()
  const tIndex = date.indexOf('T')

  const output = lines
    .slice(0, unreleasedLine + 1)
    .concat('')
    .concat(`## [${version}] - ${date.slice(0, tIndex)}`)
    .concat('')
    .concat(lines.slice(unreleasedLine + 2))

  await fs.writeFile(ctx.changelogPath, output.join('\n'))
}

function commitAndTag(version: string, { name }: IPackageJson) {
  const tag = `${name}@${version}`
  const message = `${name ?? ''} tagged at version ${version}`

  const filesToCommit = [ctx.packageJsonPath, ctx.changelogPath]

  execCommandSync('git', ['reset'])
  execCommandSync('git', ['add', ...filesToCommit])
  execCommandSync('git', ['commit', '-nm', message])
  execCommandSync('git', ['tag', '-a', tag, '-m', message])

  console.log('\n')
  console.log(`Push both branch and tag:`)
  console.log(`\tgit push && git push origin ${tag}`)
}

async function main() {
  getArgs()

  execCommandSync('cd', [packagesCwd[ctx.package]])
  execCommandSync('yarn', ['version', ctx.version])

  const packageJson = await getPackageJson()

  const nextVersion = resolveNextVersion(ctx.version, packageJson)

  await updateChangelog(nextVersion)
  commitAndTag(nextVersion, packageJson)
}

main()
  .catch((err: unknown) => console.error(`[${cliName}] ${err instanceof Error ? err.message : 'Error during bump'}`))
