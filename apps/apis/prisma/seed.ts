import 'dotenv/config'
import {
  PrismaClient,
  Prisma,
  SeasonStatus,
  FixtureStatus,
  PlayerPosition,
  PlayerStatus,
} from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

type ClubSeed = {
  name: string
  shortName?: string | null
}

type SeasonSeed = {
  name: string
  startDate: string
  endDate: string
  status: SeasonStatus
}

type GameweekSeed = {
  gwNumber: number
  date: string
}

type FixtureSeed = {
  gwNumber: number
  date: string
  homeClubName: string
  awayClubName: string
}

type ParsedPlayer = {
  name: string
  squadRaw: string
  clubName: string
  position: PlayerPosition
  status: PlayerStatus
  currentPrice: string
  nation?: string | null
  age?: string | null
  born?: string | null
}

const SQUAD_TO_CLUB: Record<string, string> = {
  Dijon: 'Dijon FCO',
  Fleury: 'FC Fleury 91',
  'Le Havre': 'Le Havre AC',
  Lens: 'RC Lens',
  Lyon: 'OL Lyonnes',
  Montpellier: 'Montpellier HSC',
  Nantes: 'FC Nantes',
  'Ol. Marseille': 'Olympique de Marseille',
  'Paris FC': 'Paris FC',
  'Paris S-G': 'Paris Saint-Germain',
  'Saint-Étienne': 'AS Saint-Etienne',
  Strasbourg: 'RC Strasbourg Alsace',
}

const DEFAULT_PRICE_BY_POSITION: Record<PlayerPosition, string> = {
  GK: '4.50',
  DEF: '5.00',
  MID: '6.50',
  FWD: '7.50',
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, 'utf-8')
  return JSON.parse(raw) as T
}

function buildUtc(date: string, time: string): Date {
  return new Date(`${date}T${time}.000Z`)
}

function normalizePosition(raw: string): PlayerPosition | null {
  const pos = (raw || '').trim().toUpperCase()
  if (!pos) return null

  const first = pos.split(',')[0]?.trim()

  if (first === 'GK') return 'GK'
  if (first === 'DF') return 'DEF'
  if (first === 'MF') return 'MID'
  if (first === 'FW') return 'FWD'

  if (pos.includes('GK')) return 'GK'
  if (pos.includes('DF')) return 'DEF'
  if (pos.includes('MF')) return 'MID'
  if (pos.includes('FW')) return 'FWD'

  return null
}

function cleanCell(value: string | undefined): string {
  return (value ?? '').replace(/^"|"$/g, '').trim()
}

function parsePlayersRawTsv(raw: string) {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const parsed: ParsedPlayer[] = []
  const skipped: Array<{ line: string; reason: string }> = []

  for (const line of lines) {
    if (line.startsWith('Player\t') || line.startsWith('Player ')) {
      continue
    }

    const cols = line.split('\t')
    const [nameRaw, nationRaw, posRaw, squadRaw, ageRaw, bornRaw] = cols

    const name = cleanCell(nameRaw)
    const squad = cleanCell(squadRaw)
    const pos = cleanCell(posRaw)
    const nation = cleanCell(nationRaw) || null
    const age = cleanCell(ageRaw) || null
    const born = cleanCell(bornRaw) || null

    if (!name) {
      skipped.push({ line, reason: 'missing player name' })
      continue
    }

    if (!squad) {
      skipped.push({ line, reason: `missing squad for ${name}` })
      continue
    }

    const clubName = SQUAD_TO_CLUB[squad]
    if (!clubName) {
      skipped.push({ line, reason: `unknown squad mapping: ${squad}` })
      continue
    }

    const position = normalizePosition(pos)
    if (!position) {
      skipped.push({ line, reason: `missing/invalid position for ${name}` })
      continue
    }

    parsed.push({
      name,
      squadRaw: squad,
      clubName,
      position,
      status: PlayerStatus.Available,
      currentPrice: DEFAULT_PRICE_BY_POSITION[position],
      nation,
      age,
      born,
    })
  }

  const dedupedMap = new Map<string, ParsedPlayer>()
  for (const player of parsed) {
    const key = `${player.clubName}__${player.name}`.toLowerCase()
    if (!dedupedMap.has(key)) {
      dedupedMap.set(key, player)
    }
  }

  const deduped = Array.from(dedupedMap.values())

  const byName = new Map<string, Set<string>>()
  for (const player of deduped) {
    const key = player.name.toLowerCase()
    if (!byName.has(key)) byName.set(key, new Set())
    byName.get(key)!.add(player.clubName)
  }

  const crossClubDuplicates = Array.from(byName.entries())
    .filter(([, clubs]) => clubs.size > 1)
    .map(([name, clubs]) => ({
      name,
      clubs: Array.from(clubs),
    }))

  return {
    parsed: deduped,
    skipped,
    crossClubDuplicates,
  }
}

async function seedClubs() {
  const filePath = path.join(process.cwd(), 'prisma', 'seed-data', 'clubs.json')
  const clubs = await readJsonFile<ClubSeed[]>(filePath)

  for (const club of clubs) {
    await prisma.club.upsert({
      where: { name: club.name },
      update: {
        shortName: club.shortName ?? null,
      },
      create: {
        name: club.name,
        shortName: club.shortName ?? null,
      },
    })
  }

  console.log(`Seeded ${clubs.length} clubs`)
}

async function seedSeason(): Promise<{ seasonId: string }> {
  const filePath = path.join(process.cwd(), 'prisma', 'seed-data', 'season.2025-2026.json')
  const season = await readJsonFile<SeasonSeed>(filePath)

  const existing = await prisma.season.findFirst({
    where: { name: season.name },
  })

  const saved = existing
    ? await prisma.season.update({
        where: { seasonId: existing.seasonId },
        data: {
          name: season.name,
          startDate: new Date(`${season.startDate}T00:00:00.000Z`),
          endDate: new Date(`${season.endDate}T00:00:00.000Z`),
          status: season.status,
        },
      })
    : await prisma.season.create({
        data: {
          name: season.name,
          startDate: new Date(`${season.startDate}T00:00:00.000Z`),
          endDate: new Date(`${season.endDate}T00:00:00.000Z`),
          status: season.status,
        },
      })

  console.log(`Seeded season: ${saved.name}`)
  return { seasonId: saved.seasonId }
}

async function seedGameweeks(seasonId: string) {
  const filePath = path.join(process.cwd(), 'prisma', 'seed-data', 'gameweeks.2025-2026.json')
  const gameweeks = await readJsonFile<GameweekSeed[]>(filePath)

  for (const gw of gameweeks) {
    await prisma.gameweek.upsert({
      where: {
        seasonId_gwNumber: {
          seasonId,
          gwNumber: gw.gwNumber,
        },
      },
      update: {
        deadlineAt: buildUtc(gw.date, '11:00:00'),
        startsAt: buildUtc(gw.date, '12:00:00'),
        endsAt: buildUtc(gw.date, '23:59:59'),
      },
      create: {
        seasonId,
        gwNumber: gw.gwNumber,
        deadlineAt: buildUtc(gw.date, '11:00:00'),
        startsAt: buildUtc(gw.date, '12:00:00'),
        endsAt: buildUtc(gw.date, '23:59:59'),
      },
    })
  }

  console.log(`Seeded ${gameweeks.length} gameweeks`)
}

async function seedPlayers() {
  const filePath = path.join(process.cwd(), 'prisma', 'seed-data', 'players-raw.tsv')
  const raw = await readFile(filePath, 'utf-8')

  const { parsed, skipped, crossClubDuplicates } = parsePlayersRawTsv(raw)

  const clubs = await prisma.club.findMany()
  const clubIdByName = new Map(clubs.map((club) => [club.name, club.clubId]))

  const playersToCreate = parsed
    .map((player) => {
      const clubId = clubIdByName.get(player.clubName)
      if (!clubId) {
        throw new Error(`Club not found in database: ${player.clubName}`)
      }

      return {
        name: player.name,
        clubId,
        position: player.position,
        status: player.status,
        currentPrice: new Prisma.Decimal(player.currentPrice),
      }
    })
    .sort((a, b) => {
      if (a.clubId !== b.clubId) return a.clubId.localeCompare(b.clubId)
      return a.name.localeCompare(b.name)
    })

  await prisma.$transaction([
    prisma.player.deleteMany({}),
    prisma.player.createMany({
      data: playersToCreate,
    }),
  ])

  console.log(`Seeded ${playersToCreate.length} players`)

  if (skipped.length > 0) {
    console.log('\nSkipped rows:')
    for (const item of skipped) {
      console.log(`- ${item.reason}`)
    }
  }

  if (crossClubDuplicates.length > 0) {
    console.log('\nCross-club duplicate names (manual review recommended):')
    for (const item of crossClubDuplicates) {
      console.log(`- ${item.name}: ${item.clubs.join(' / ')}`)
    }
  }
}

async function seedFixtures(seasonId: string) {
  const filePath = path.join(process.cwd(), 'prisma', 'seed-data', 'fixtures.2025-2026.json')
  const fixtures = await readJsonFile<FixtureSeed[]>(filePath)

  const clubs = await prisma.club.findMany()
  const clubIdByName = new Map(clubs.map((club) => [club.name, club.clubId]))

  const gameweeks = await prisma.gameweek.findMany({
    where: { seasonId },
  })
  const gameweekIdByNumber = new Map(gameweeks.map((gw) => [gw.gwNumber, gw.gameweekId]))

  await prisma.fixture.deleteMany({
    where: { seasonId },
  })

  for (const fixture of fixtures) {
    const homeClubId = clubIdByName.get(fixture.homeClubName)
    const awayClubId = clubIdByName.get(fixture.awayClubName)
    const gameweekId = gameweekIdByNumber.get(fixture.gwNumber)

    if (!homeClubId) {
      throw new Error(`Home club not found: ${fixture.homeClubName}`)
    }
    if (!awayClubId) {
      throw new Error(`Away club not found: ${fixture.awayClubName}`)
    }
    if (!gameweekId) {
      throw new Error(`Gameweek not found: GW${fixture.gwNumber}`)
    }

    await prisma.fixture.create({
      data: {
        seasonId,
        gameweekId,
        homeClubId,
        awayClubId,
        kickoffAt: buildUtc(fixture.date, '12:00:00'),
        status: FixtureStatus.Scheduled,
      },
    })
  }

  console.log(`Seeded ${fixtures.length} fixtures`)
}

async function main() {
  await seedClubs()
  const { seasonId } = await seedSeason()
  await seedGameweeks(seasonId)
  await seedPlayers()
  await seedFixtures(seasonId)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })