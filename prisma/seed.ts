import { PrismaClient } from './generated/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  // Create seed data
  console.log('Starting database seed...');

  // Create game config
  await prisma.gameConfig.create({
    data: {
      startTime: new Date(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      isActive: true,
    },
  });

  console.log('Game config created successfully');

  // Create initial site configurations
  const siteConfigs: { key: string; value: string }[] = [
    {
      key: 'homepage_title',
      value: 'Welcome to PwnCTF'
    },
    {
      key: 'site_title',
      value: 'PwnCTF'
    },
    {
      key: 'homepage_subtitle',
      value: '80s retro ui, space-themed, batteries included CTF platform.'
    },
    {
      key: 'rules_text',
      value: `
Following actions are prohibited, unless explicitly told otherwise by event Admins.

### Rule 1 - Cooperation

No cooperation between teams with independent accounts. Sharing of keys or providing revealing hints to other teams is cheating, don't do it.

### Rule 2 - Attacking Scoreboard

No attacking the competition infrastructure. If bugs or vulns are found, please alert the competition organizers immediately.

### Rule 3 - Sabotage

Absolutely no sabotaging of other competing teams, or in any way hindering their independent progress.

### Rule 4 - Bruteforcing

No brute forcing of challenge flag/ keys against the scoring site.

### Rule 5 - Denial Of Service

DoSing the CTF platform or any of the challenges is forbidden.

##### Legal Disclaimer

By participating in the contest, you agree to release the organizer, and the hosting organization from any and all liability, claims or actions of any kind whatsoever for injuries, damages or losses to persons and property which may be sustained in connection with the contest. You acknowledge and agree that Facebook et al is not responsible for technical, hardware or software failures, or other errors or problems which may occur in connection with the contest.

If you have any questions about what is or is not allowed, please ask an organizer.

Have fun!`
    }
  ];

  for (const config of siteConfigs) {
    await prisma.siteConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: {
        key: config.key,
        value: config.value
      }
    });
  }

  console.log('Site configurations created successfully');
  console.log('Database has been seeded. 🌱');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });