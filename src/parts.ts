
import { array } from 'fp-ts/lib/Array'
import { Predicate } from 'fp-ts/lib/function'
import { reader, asks, Reader } from 'fp-ts/lib/Reader'
import { fromTraversable, Lens } from 'monocle-ts'

import { $PropertyType } from 'utility-types'
import { Configuration as WebpackConfig, Module, Plugin, Resolve, Rule, RuleSetRule } from 'webpack'
import { Configuration as DevServerConfiguration } from 'webpack-dev-server'

export type Entry = $PropertyType<WebpackConfig, 'entry'>
export type Externals = $PropertyType<WebpackConfig, 'externals'>
export type Targets = $PropertyType<WebpackConfig, 'target'>
export type Modes = NonNullable<$PropertyType<WebpackConfig, 'mode'>>
export type DevTool = Exclude<$PropertyType<WebpackConfig, 'devtool'>, undefined>
export type Output = $PropertyType<WebpackConfig, 'output'>
export type Optimization = $PropertyType<WebpackConfig, 'optimization'>
export type Rules = $PropertyType<Module, 'rules'>
export type Alias = $PropertyType<Resolve, 'alias'>
export type Extensions = $PropertyType<Resolve, 'extensions'>
export type MainFields = $PropertyType<Resolve, 'mainFields'>
export type RuleType = $PropertyType<Rule, 'type'>

export interface UserConfig {
  externals: Externals
  target: Targets,
  env: Modes
  hmr: boolean
  host: string
  standalone: boolean
  dist: string
  port: number
  publicPath: string
  watch: boolean
}

export type Configuration = WebpackConfig & { devServer?: DevServerConfiguration }
export type ConfigDefinition<K = UserConfig> = Reader<Partial<K>, Configuration>
export type ChainableConfigDefinition<K = UserConfig> = (config: Configuration) => ConfigDefinition<K>
export type ConfigPart<A> = Reader<Partial<UserConfig>, A>
export type ChainableConfigPart = (config: Configuration) => ConfigDefinition

export const configurationT = Lens.fromNullableProp<Configuration>()
export const resolveT = Lens.fromNullableProp<Resolve>()

export const module = configurationT<Module, 'module'>('module', { rules: [] })
export const target = configurationT<Targets, 'target'>('target', 'web')
export const mode = configurationT<Modes, 'mode'>('mode', 'development')
export const devTool = configurationT<DevTool, 'devtool'>('devtool', 'cheap-eval-source-map')

export const externals = configurationT<Externals, 'externals'>('externals', {})
export const output = configurationT<Output, 'output'>('output', {})
export const entry = configurationT<Entry, 'entry'>('entry', {})
export const optimization = configurationT<Optimization, 'optimization'>('optimization', {})

export const resolve = configurationT<Resolve, 'resolve'>('resolve', {})
export const alias = resolveT<Alias, 'alias'>('alias', {})
export const extensions = resolveT<Extensions, 'extensions'>('extensions', [])
export const mainFields = resolveT<MainFields, 'mainFields'>('mainFields', [])

export const devServer = configurationT<DevServerConfiguration, 'devServer'>('devServer', {})
export const plugins = configurationT<Plugin[], 'plugins'>('plugins', [])
export const rules = Lens.fromNullableProp<Module, Rules, 'rules'>('rules', [])

export const devServerT = Lens.fromNullableProp<DevServerConfiguration>()
export const devServerPort = devServerT<number, 'port'>('port', 8080)
export const devServerHost = devServerT<string, 'host'>('host', 'localhost')

export const withDevServerPort = devServer.compose(devServerPort)
export const withDevServerHost = devServer.compose(devServerHost)

// shorthands
// modifiers
export const withRules = module.compose(rules)
export const withExternals = externals
export const withOutput = output
export const withPlugins = plugins
export const withEntry = entry
export const withOptimization = optimization
export const withAlias = resolve.compose(alias)

export const makeConfig = <K = UserConfig>(config: Configuration): ConfigDefinition<K> => reader.of({ ...config })

// overridings
export const withTarget = target
export const withMode = mode
export const withDevTool = devTool
export const withExtensions = resolve.compose(extensions)
export const withMainFields = resolve.compose(mainFields)

// getters
export const getMode = mode

export const attachDevServer: ConfigDefinition = asks(env => ({
  historyApiFallback: true,
  contentBase: env.dist,
  publicPath: env.publicPath,
  host: env.host || 'localhost',
  compress: true,
  inline: env.hmr,
  hot: env.hmr,
  stats: {
    assets: false,
    colors: true,
    version: false,
    hash: false,
    timings: false,
    chunks: false,
    chunkModules: false
  },
  port: env.port,
  watchOptions: {
    poll: true
  }
}))

// predicates
type CheckUserConfig = Predicate<Partial<UserConfig>>

export const isLocal: CheckUserConfig = (userConfig) => !userConfig.env || userConfig.env === 'none'
export const isProduction: CheckUserConfig = (userConfig) => userConfig.env === 'production'
export const isDevelopment: CheckUserConfig = (userConfig) => userConfig.env === 'development'
export const isWeb: CheckUserConfig = (userConfig) => userConfig.target === 'web'
export const isNode: CheckUserConfig = (userConfig) => userConfig.target === 'node'
export const isStandalone: CheckUserConfig = (userConfig) => userConfig.standalone === true

export { RuleSetRule, RuleSetLoader, Plugin, Module } from 'webpack'

// extra type
export type LoaderRule = ConfigPart<Rule>
export type PluginsRule = ConfigPart<Plugin[]>

// better would be to rename it to append
export const applyRuleAtTheEnd = (rule: Rule) => withRules.modify(existing => [...existing, rule])
export const applyRuleAtTheBeginning = (rule: Rule) => withRules.modify(existing => [rule, ...existing])

// make plural form
export const applyPluginAtTheEnd = (plugins: Plugin[]) => withPlugins.modify(existing => existing.concat(plugins))
export const applyPluginAtTheBeginning = (plugins: Plugin[]) => withPlugins.modify(existing => plugins.concat(existing))

export const ruleSetUse = Lens.fromProp<RuleSetRule, 'use'>('use')

export const rulesTraversal = fromTraversable(array)<RuleSetRule>()
export const traverseModuleRules = withRules.composeTraversal(rulesTraversal)
