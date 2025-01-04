import db from '@/lib/db';
import { NextResponse } from 'next/server';
import { generateBarcode } from '@/lib/barcodeGenerator';
import { imageFileToBase64 } from '@/lib/imageToBase64';
import { ensureDirectoryExists } from '@/lib/helperFun';
import { generateUniqueUSEAId, generateBarcodeImage, createIdCardPDF } from '@/lib/helperFun';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export async function POST() {
  try {
    console.log("Test");
    console.log('POST /api/reg');
    const payload = {
      message: 'Registration successful',
    }

    return NextResponse.json({ payload }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
