import fs from 'fs'
import path from 'path'

import { glob } from 'glob'

import { version } from '../package.json'
import { NETWORK_DATA } from './chains'
import { TokenData } from './types'

/**
 * Base URL where static assets are hosted.
 */
const BASE_URL = 'https://token-list.mantle.xyz'

/**
 * Generates a token list from the data in the data folder.
 *
 * @param datadir Directory containing data files.
 *
 * @returns Generated token list JSON object.
 */
export const generate = (datadir: string) => {
  return fs
    .readdirSync(datadir)
    .sort((a, b) => {
      return a.toLowerCase().localeCompare(b.toLowerCase())
    })
    .map((folder) => {
      const data: TokenData = JSON.parse(
        fs.readFileSync(path.join(datadir, folder, 'data.json'), 'utf8')
      )
      const logofiles = glob.sync(
        `${path.join(datadir, folder)}/logo.{png,svg}`
      )
      console.log('data:', data)
      console.log('logofiles:', logofiles)
      const logoext = logofiles[0].endsWith('png') ? 'png' : 'svg'
      return Object.entries(data.tokens).map(([chain, token]) => {
        const extensions: any = {}
        switch (true) {
          case !!data?.extensions?.thirdparty:
            extensions.thirdparty = data.extensions.thirdparty
            break

          case !!data?.extensions?.external:
            extensions.external = data.extensions.external
            break

          default:
            extensions.optimismBridgeAddress =
              token.overrides?.bridge ?? NETWORK_DATA[chain].bridge
            break
        }

        return {
          chainId: NETWORK_DATA[chain].id,
          address: token.address,
          name: token.overrides?.name ?? data.name,
          symbol: token.overrides?.symbol ?? data.symbol,
          decimals: token.overrides?.decimals ?? data.decimals,
          logoURI: `${BASE_URL}/data/${folder}/logo.${logoext}`,
          extensions,
          tickers: data.tickers,
        }
      })
    })
    .reduce(
      (list, tokens) => {
        list.tokens = list.tokens.concat(tokens)
        return list
      },
      {
        name: 'Mantle',
        logoURI: `${BASE_URL}/mantle_logo.svg`,
        keywords: ['scaling', 'layer2', 'infrastructure'],
        timestamp: new Date().toISOString(),
        tokens: [],
        version: {
          major: parseInt(version.split('.')[0], 10),
          minor: parseInt(version.split('.')[1], 10),
          patch: parseInt(version.split('.')[2], 10),
        },
      }
    )
}
