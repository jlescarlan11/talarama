// import { NextRequest } from "next/server";

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();
//     console.log(body);

//     const validation = diarySchema.safeParse(body);

//     if (!validation.success) {
//       return NextResponse.json(validation.error.format(), { status: 400 });
//     }
//   } catch (error) {
//     console.log(error);
//   }
// }
