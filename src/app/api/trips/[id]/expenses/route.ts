import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server-admin'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, { params }: Ctx) {
  const { id } = await params
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('expenses')
    .select('*')
    .eq('trip_id', id)
    .order('date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const body = await req.json()
  const { category, amount, note, date } = body

  if (!category || !amount) {
    return NextResponse.json({ error: 'category and amount are required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('expenses')
    .insert({ trip_id: id, category, amount: Number(amount), note: note || null, date: date || new Date().toISOString().split('T')[0] })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id: tripId } = await params
  const { searchParams } = new URL(req.url)
  const expenseId = searchParams.get('expenseId')

  if (!expenseId) return NextResponse.json({ error: 'expenseId required' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('expenses')
    .delete()
    .eq('id', expenseId)
    .eq('trip_id', tripId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
