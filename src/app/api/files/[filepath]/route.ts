import { NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { filepath?: string } }
) {
  try {
    const rawPath = params?.filepath;
    if (!rawPath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }

    let decodedPath = rawPath;
    try {
      decodedPath = decodeURIComponent(rawPath);
    } catch {
      decodedPath = rawPath;
    }

    const normalizedPath = decodedPath.startsWith('/') ? decodedPath : `/${decodedPath}`;

    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get the file record from the database using the path
    const fileRecord = await prisma.challengeFile.findFirst({
      where: { path: normalizedPath }
    });

    if (!fileRecord) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Convert the public path to a filesystem path
    const relativePath = fileRecord.path.replace(/^\/+/, '');
    const filePath = join(process.cwd(), 'public', relativePath);

    // Delete the file from the filesystem
    try {
      await unlink(filePath);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }

    // Delete the file record from the database
    await prisma.challengeFile.delete({
      where: { id: fileRecord.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    const message = error instanceof Error ? error.message : 'Error deleting file';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
