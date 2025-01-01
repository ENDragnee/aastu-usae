import { NextResponse } from 'next/server'

let participants: any[] = [];

export async function GET() {
  return NextResponse.json(participants)
}

export async function POST(request: Request) {
  const participant = await request.json()
  participant.id = Date.now().toString()
  participant.barcode = Math.random().toString(36).substr(2, 7).toUpperCase()
  participants.push(participant)
  return NextResponse.json(participant, { status: 201 })
}

export async function PUT(request: Request) {
  const updatedParticipant = await request.json()
  const index = participants.findIndex(p => p.id === updatedParticipant.id)
  if (index !== -1) {
    participants[index] = updatedParticipant
    return NextResponse.json(updatedParticipant)
  }
  return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  participants = participants.filter(p => p.id !== id)
  return NextResponse.json({ message: 'Participant deleted successfully' })
}

