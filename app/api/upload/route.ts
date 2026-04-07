// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { PDFParse } from 'pdf-parse';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const formData = await req.formData();

    const file = formData.get('file') as File;
    const classId = formData.get('class_id') as string;

    if (!file || !classId) {
      return NextResponse.json(
        { error: '파일과 class_id가 필요합니다.' },
        { status: 400 }
      );
    }

    // PDF → 텍스트 추출
    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    await parser.destroy();
    const extractedText = parsed.text;

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: 'PDF에서 텍스트를 추출할 수 없습니다. 이미지 기반 PDF는 지원되지 않습니다.' },
        { status: 400 }
      );
    }

    // Supabase materials 테이블에 저장
    const { data, error } = await supabase
      .from('materials')
      .insert({
        class_id: classId,
        filename: file.name,
        content: extractedText.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: '저장 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      material_id: data.id,
      filename: file.name,
      text_length: extractedText.length,
    });

  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

