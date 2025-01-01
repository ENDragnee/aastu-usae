import { generateBarcode } from '@/lib/barcodeGenerator';
import db from '@/lib/db';
import puppeteer from 'puppeteer';
import { writeFile } from 'fs/promises';
import path from 'path';
import bwipjs from 'bwip-js';


export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

// Helper function to generate a unique USEA ID
async function generateUniqueUSEAId() {
  const [result] = await db.execute(
    'SELECT unique_id FROM participant WHERE unique_id LIKE "USEA%" ORDER BY unique_id DESC LIMIT 1'
  );

  let nextNumber = 1;
  if (result[0]) {
    const lastId = result[0].unique_id;
    const lastNumber = parseInt(lastId.replace('USEA', ''));
    nextNumber = lastNumber + 1;
  }

  return `USEA${nextNumber.toString().padStart(4, '0')}`;
}

export async function generateBarcodeImage(text) {
  try {
    const barcodeBuffer = bwipjs.toBuffer({
      bcid: 'code128', // Barcode type
      text, // Text to encode
      scale: 3, // 3x scaling
      height: 10, // Height in mm
      includetext: true, // Include text under barcode
      textxalign: 'center', // Align text
    });

    return `data:image/png;base64,${barcodeBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Error generating barcode:', error);
    throw error;
  }
}
// POST handler
export async function POST(req) {
  try {
    const body = await req.json();
    const { fullName, phoneNumber, university, responsibility, photo } = body;

    // Generate unique IDs
    const unique_id = await generateUniqueUSEAId();
    const barcode_id = generateBarcode();
    const barcode_image = await generateBarcodeImage(barcode_id);

    // Get university ID from name
    const [universityData] = await db.execute(
      'SELECT id FROM university WHERE name = ?',
      [university]
    );
    const universityId = universityData[0]?.id;
    if (!universityId) {
      return new Response(
        JSON.stringify({ message: 'Invalid university' }),
        { status: 400 }
      );
    }

    // Render ID card with Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>ID Card</title>
        <style>
          body {
            font-family: Arial, sans-serif;
          }
          .id-card {
            width: 400px;
            min-height: 650px;
            background-color: white;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            overflow: hidden;
            position: relative;
            margin: auto;
          }
          .gold-bar {
            height: 4px;
            background: linear-gradient(to right, #C5A572, #DBCA9A);
          }
          .header {
            text-align: center;
            background-color: white;
            padding: 16px;
          }
          .logos {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 16px;
          }
          .logos img {
            width: 48px;
            height: 48px;
          }
          .title {
            flex: 1;
            padding: 0 16px;
            text-align: center;
            color: #1B3149;
            font-size: 20px;
            font-weight: bold;
          }
          .photo-section {
            text-align: center;
            padding: 16px;
          }
          .photo {
            width: 192px;
            height: 192px;
            border-radius: 24px;
            overflow: hidden;
            border: 4px solid #1B3149;
            margin: auto;
          }
          .photo img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .details {
            text-align: center;
            padding: 16px;
          }
          .details h2 {
            color: #1B3149;
            font-size: 24px;
            font-weight: bold;
          }
          .university {
            background-color: #1B3149;
            color: #C5A572;
            font-size: 18px;
            font-weight: bold;
            padding: 8px 16px;
            border-radius: 999px;
            display: inline-block;
            margin-bottom: 16px;
          }
          .info {
            text-align: left;
            max-width: 240px;
            margin: auto;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 16px;
            color: #1B3149;
          }
          .barcode {
            margin-top: 16px;
            text-align: center;
          }
          .barcode img {
            max-width: 300px;
          }
          .role-badge {
            position: absolute;
            top: 500px;
            right: 16px;
            width: 48px;
            height: 48px;
            background-color: #1B3149;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 18px;
            font-weight: bold;
            border-radius: 50%;
          }
        </style>
      </head>
      <body>
        <div class="id-card">
          <div class="gold-bar"></div>
          <div class="header">
            <div class="logos">
              <img src="/public/usea.png" alt="USAE Logo" />
              <div class="title">
                Universities Sport Association Ethiopia
              </div>
              <img src="/public/aastu.png" alt="AASTU Logo" />
            </div>
          </div>
          <div class="photo-section">
            <div class="photo">
              <img src="${photo || '/placeholder.svg?height=192&width=192'}" alt="Profile Photo" />
            </div>
          </div>
          <div class="details">
            <h2>${fullName}</h2>
            <div class="university">${university}</div>
            <div class="info">
              <div class="info-row"><span>Responsibility:</span><span>${responsibility}</span></div>
              <div class="info-row"><span>USEA ID:</span><span>${unique_id}</span></div>
            </div>
            <div class="barcode">
              <img src="data:image/png;base64,${barcode_image}" alt="Barcode" />
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: 'load' });
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const idCardFilename = `${unique_id}_id_card.png`;
    const idCardPath = path.join(uploadDir, idCardFilename);

    await page.screenshot({ path: idCardPath });
    await browser.close();

    // Save participant data
    const [result] = await db.execute(
      `INSERT INTO participant 
       (name, phone_number, university, responsibility, photo, unique_id, barcode_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        fullName,
        phoneNumber,
        universityId,
        responsibility,
        `/uploads/${idCardFilename}`,
        unique_id,
        barcode_id,
      ]
    );

    return new Response(
      JSON.stringify({
        message: 'Participant registered successfully',
        participant: {
          id: result.insertId,
          name: fullName,
          phone_number: phoneNumber,
          university,
          responsibility,
          photo: `/uploads/${idCardFilename}`,
          unique_id,
          barcode_id,
        },
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return new Response(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500 }
    );
  }
}
