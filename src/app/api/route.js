import { generateBarcode } from '@/lib/barcodeGenerator';
import db from '@/lib/db';
import { writeFile } from 'fs/promises';
import path from 'path';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

// Helper function to generate a unique USEA ID
async function generateUniqueUSEAId(){
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

// POST handler
export async function POST(req) {
  try {
    const { fullName, phoneNumber, university, responsibility, photo } = await req.json();

    // Generate unique IDs
    const unique_id = await generateUniqueUSEAId();
    const barcode_id = generateBarcode();

    // Handle photo upload
    let photoPath = '';
    if (photo) {
      const base64Data = photo.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const filename = `${unique_id}.jpg`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      const filepath = path.join(uploadDir, filename);

      await writeFile(filepath, buffer);
      photoPath = `/uploads/${filename}`;
    }

    // Get university ID from name
    const [universityData] = await db.execute(
      'SELECT id FROM university WHERE name = ?',
      [university]
    );
    const universityId = universityData[0]?.id;
    if (!universityId) {
      return new Response(JSON.stringify({ message: 'Invalid university' }), {
        status: 400,
      });
    }

    // Insert participant into database
    const [result] = await db.execute(
      `INSERT INTO participant 
       (name, phone_number, university, responsibility, photo, unique_id, barcode_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        fullName,
        phoneNumber,
        universityId,
        responsibility,
        photoPath,
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
          photo: photoPath,
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
