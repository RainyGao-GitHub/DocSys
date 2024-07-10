package com.DocSystem.test;

import org.lwjgl.PointerBuffer;
import org.lwjgl.system.MemoryStack;
import org.lwjgl.system.Pointer;
import org.lwjgl.util.freetype.FT_Bitmap;
import org.lwjgl.util.freetype.FT_Face;
import org.lwjgl.util.freetype.FT_Open_Args;
import org.lwjgl.util.freetype.FT_Parameter;
import org.lwjgl.util.freetype.FreeType;
import java.nio.ByteBuffer;
import java.nio.file.Files;
import java.nio.file.Paths;

import static org.lwjgl.system.MemoryUtil.*;
import static org.lwjgl.util.freetype.FreeType.*;
import java.nio.charset.Charset;

import com.DocSystem.common.Log;

class FreeTypeTest  
{
    public static void main(String[] args) {
        // Initialize FreeType library
        try (MemoryStack stack = MemoryStack.stackPush()) {
            // Initialize FreeType library
            PointerBuffer pLibrary = stack.mallocPointer(1);
            checkError(FT_Init_FreeType(pLibrary));
            long library = pLibrary.get(0);
            
            FT_Parameter.Buffer pParams = FT_Parameter.malloc(4, stack);
            pParams.get(0).tag(FT_MAKE_TAG('i', 'g', 'p', 'f')).data(0);
            pParams.get(1).tag(FT_MAKE_TAG('i', 'g', 'p', 's')).data(0);
            pParams.get(2).tag(FT_MAKE_TAG( 'i', 'g', 'p', 'f' )).data(0);        
            pParams.get(3).tag(FT_MAKE_TAG( 'i', 'g', 'p', 's' )).data(0);
            
            // Load a font file
            String fontFilePath = "C:/Dev/DocSys/WebRoot/web/static/office-editor/core-fonts/freefont/FreeMono.ttf";
            ByteBuffer fontBuffer = readFontFile(fontFilePath);

            // Set up FT_Open_Args
            FT_Open_Args openArgs = FT_Open_Args.calloc(stack);
            openArgs.flags(FT_OPEN_MEMORY | FT_OPEN_PARAMS);
            openArgs.memory_base(fontBuffer);
            openArgs.memory_size(fontBuffer.capacity());
            openArgs.num_params(4);
            openArgs.params(pParams);

            // Create Font Face
            PointerBuffer pFace = stack.mallocPointer(1);
            checkError(FT_Open_Face(library, openArgs, 0, pFace));
            FT_Face face = FT_Face.create(pFace.get(0));

            // Set pixel size
            int pixelW = 0;
            int pixelH = 48;
            checkError(FT_Set_Pixel_Sizes(face, pixelW, pixelH));

            // Load glyph for character 'A'
            int charCode = 'A';
            checkError(FT_Load_Char(face, charCode, FT_LOAD_DEFAULT));

            // Render glyph bitmap
            checkError(FT_Render_Glyph(face.glyph(), FT_RENDER_MODE_NORMAL));

            // Output bitmap information
            FT_Bitmap bitmap = face.glyph().bitmap();
            System.out.println("Bitmap width: " + bitmap.width());
            System.out.println("Bitmap rows: " + bitmap.rows());
            //System.out.println("Bitmap buffer size: " + bitmap.buffer().capacity());

            // Free resources
            FT_Done_Face(face);
            FT_Done_FreeType(library);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static ByteBuffer readFontFile(String fontFilePath) throws Exception {
        byte[] fontData = Files.readAllBytes(Paths.get(fontFilePath));
        ByteBuffer buffer = memAlloc(fontData.length);
        buffer.put(fontData);
        buffer.flip();
        return buffer;
    }

    private static void checkError(int errorCode) {
        if (errorCode != 0) {
            throw new RuntimeException("FreeType error code: " + errorCode);
        }
    }
}  