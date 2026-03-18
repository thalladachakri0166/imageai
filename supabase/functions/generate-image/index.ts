import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      originalImage, 
      selectedOptions, 
      style, 
      prompt, 
      referenceImages 
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // 🔥 UNRESTRICTED SYSTEM PROMPT
    const systemPrompt = `
You are a creative AI image generator.
You may freely modify any aspect of the image.
There are no restrictions on realism, background, face, body, pose, clothing, or style.
Creativity is encouraged.
    `;

    // 🔥 UNRESTRICTED USER PROMPT
    const userPrompt = prompt
      ? prompt
      : "Create a visually interesting and creative version of this image.";

    const messages: any[] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          {
            type: "image_url",
            image_url: { url: originalImage }
          }
        ]
      }
    ];

    // Optional reference images (pure inspiration, no rules)
    if (referenceImages && referenceImages.length > 0) {
      messages.push({
        role: "user",
        content: referenceImages.slice(0, 3).map((img: { url: string }) => ({
          type: "image_url",
          image_url: { url: img.url }
        }))
      });
    }

    // Generate 2-3 images instead of 1
    const numImages = 3;
    const generatedImages: string[] = [];

    const models = [
      "google-imagen-2024-07-24",
      "google/gemini-2.5-flash-image-preview" // Fallback
    ];

    for (let i = 0; i < numImages; i++) {
      let generatedImage = null;

      for (const model of models) {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model,  // Try each model
            messages,
            modalities: ["image"]
          }),
        });

        if (response.ok) {
          const data = await response.json();
          generatedImage = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          if (generatedImage) break; // Success, stop trying
        }
      }

      if (generatedImage) {
        generatedImages.push(generatedImage);
      }
    }

    return new Response(
      JSON.stringify({ generatedImages }), // Return array instead of single image
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        code: "INTERNAL_ERROR"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
