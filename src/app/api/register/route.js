import { generateBarcode } from '@/lib/barcodeGenerator';
import { imageFileToBase64 } from '@/lib/imageToBase64';
import db from '@/lib/db';
import puppeteer from 'puppeteer';
import path from 'path';
import bwipjs from 'bwip-js';
import { promises as fsPromises } from 'fs';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

// Helper function to ensure a directory exists
async function ensureDirectoryExists(dir) {
  try {
    await fsPromises.mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

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

export async function generateBarcodeImage(text){
  try {
    const barcodeBuffer = await bwipjs.toBuffer({
      bcid: 'code128',
      text,
      scale: 3,
      height: 10,
      includetext: true,
      textxalign: 'center',
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
    
    const aastu = await imageFileToBase64('aastu.png');
    const usea = await imageFileToBase64('usea.png');
    
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
            margin: 0;
            padding: 0;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: #f0f0f0;
          }
          .id-card {
            width: 100%;
            max-width: 360px;
            height: auto;
            background-color: white;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border-radius: 12px;
            overflow: hidden;
          }
          .gold-bar {
            height: 4px;
            background: linear-gradient(to right, #C5A572, #DBCA9A);
          }
          .header {
            padding: 8px;
            height: 40px;
          }
          .logos {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 8px;
          }
          .logos img {
            width: 40px;
            height: 40px;
          }
          .title {
            flex: 1;
            padding: 0 8px;
            text-align: center;
            color: #1B3149;
            font-size: 16px;
            font-weight: bold;
          }
          .photo-section {
            text-align: center;
            padding: 12px;
          }
          .photo {
            width: 160px;
            height: 160px;
            border-radius: 16px;
            overflow: hidden;
            border: 3px solid #1B3149;
            margin: auto;
          }
          .photo img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .details {
            text-align: center;
            padding: 12px;
          }
          .details h2 {
            color: #1B3149;
            font-size: 20px;
            font-weight: bold;
          }
          .university {
            background-color: #1B3149;
            color: #C5A572;
            font-size: 14px;
            font-weight: bold;
            padding: 6px 12px;
            border-radius: 999px;
            display: inline-block;
            margin-bottom: 12px;
          }
          .custom-university {
            font-size: 24px;
            font-weight: bold;
            color: #1B3149;
            margin: 16px 0;
            text-align: center;
            padding: 8px;
            display: inline-block;
          }
          .info {
            text-align: left;
            max-width: 220px;
            margin: auto;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
            font-size: 14px;
            color: #1B3149;
          }
          .barcode {
            margin-top: 12px;
            text-align: center;
          }
          .barcode img {
            max-width: 260px;
          }
          .role-badge {
            position: absolute;
            bottom: 16px;
            right: 16px;
            width: 40px;
            height: 40px;
            background-color: #1B3149;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 14px;
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
              <img src="${aastu}" alt="AASTU Logo" style="width: 60px; height: 60px;"/>
              <div class="title">Universities Sport Association Ethiopia</div>
              <img src="${usea}" alt="USAE Logo" />
            </div>
          </div>
          <div class="photo-section">
            <div class="photo">
              <img src="${photo || '/placeholder.svg?height=192&width=192'}" alt="Profile Photo" />
            </div>
          </div>
          <div class="details">
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <div class="custom-university" style="font-size: 30px;">${fullName}</div>
              <div class="custom-university">${university}</div>
              <div class="university" style="max-width: 50%;">${responsibility}</div>
            </div>
            <div class="info">
              <div class="info-row"><span>USEA ID:</span><span>${unique_id}</span></div>
              <div class="info-row"><span>Phone:</span><span>${phoneNumber}</span></div>
            </div>
            <div class="barcode">
              <img src="${barcode_image}" alt="Barcode" />
            </div>
          </div>
        </div>
      </body>
      </html>

    `;
    await page.setContent(html, { waitUntil: 'load' });
    await page.screenshot({ path: 'debug.png' });

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', university);
    await ensureDirectoryExists(uploadDir);
    const idCardFilename = `${unique_id}.png`;
    const idCardPath = path.join(uploadDir, idCardFilename);

          // Wait for the ID card element to be rendered
      await page.waitForSelector('.id-card');

      // Get the bounding box of the ID card
      const idCardElement = await page.$('.id-card');
      const boundingBox = await idCardElement.boundingBox();

      // Capture screenshot of the bounding box
      await page.screenshot({
        path: idCardPath,
        clip: {
          x: boundingBox.x,
          y: boundingBox.y,
          width: boundingBox.width,
          height: boundingBox.height,
        },
      });

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
        `/uploads/${university}/${idCardFilename}`,
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
