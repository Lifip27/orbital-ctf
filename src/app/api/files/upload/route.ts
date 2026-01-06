import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { basename, join } from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const challengeId = formData.get('challengeId') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!challengeId) {
      return NextResponse.json({ error: 'No challenge ID provided' }, { status: 400 });
    }

    // Get challenge details
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId }
    });

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Create normalized folder name from challenge title
    const normalizedFolderName = challenge.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const folderName = normalizedFolderName || `challenge-${challenge.id}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = basename(file.name);
    const challengeDir = join(process.cwd(), 'public', 'uploads', folderName);
    
    // Create challenge directory if it doesn't exist
    try {
      await mkdir(challengeDir, { recursive: true });
    } catch (error) {
      console.error('Error creating challenge directory:', error);
      return NextResponse.json(
        { error: 'Error creating challenge directory' },
        { status: 500 }
      );
    }

    const path = join(challengeDir, filename);

    // Write the file to the challenge directory
    await writeFile(path, buffer);

    // Create ChallengeFile record
    const challengeFile = await prisma.challengeFile.create({
      data: {
        name: file.name,
        path: `/uploads/${folderName}/${filename}`,
        size: file.size,
        challengeId: challenge.id
      }
    });

    return NextResponse.json({
      name: file.name,
      path: challengeFile.path,
      size: file.size,
      id: challengeFile.id
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    const message = error instanceof Error ? error.message : 'Error uploading file';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
} 
