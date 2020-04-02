#include <ft2build.h>
#include "ftsnames.h"
#include FT_OUTLINE_H
#include FT_SIZES_H
#include FT_GLYPH_H
#include FT_TRUETYPE_IDS_H
#include FT_TRUETYPE_TABLES_H
#include FT_XFREE86_H
#include FT_ADVANCES_H
#include FT_LCD_FILTER_H
#include FT_DRIVER_H
#include FT_INTERNAL_TRUETYPE_TYPES_H
#include "ftmodapi.h"

void* ASC_FT_Malloc(unsigned int size)
{
	return ft_smalloc((size_t)size);
}

void ASC_FT_Free(void* p)
{
	ft_sfree(p);
}

FT_Library ASC_FT_Init()
{
	FT_Library library = NULL;
	FT_Init_FreeType(&library);
	FT_Library_SetLcdFilter(library, FT_LCD_FILTER_DEFAULT);
	return library;
}

FT_Face ASC_FT_Open_Face(FT_Library library, unsigned char* memory, unsigned int size, int face_index)
{
	FT_Open_Args oOpenArgs;
	oOpenArgs.flags			= FT_OPEN_MEMORY | FT_OPEN_PARAMS;
	oOpenArgs.memory_base	= memory;
    oOpenArgs.memory_size	= (FT_Long)size;

	FT_Parameter *pParams = (FT_Parameter *)ft_smalloc( sizeof(FT_Parameter) * 4 );
	pParams[0].tag  = FT_MAKE_TAG( 'i', 'g', 'p', 'f' );
	pParams[0].data = NULL;
	pParams[1].tag  = FT_MAKE_TAG( 'i', 'g', 'p', 's' );
	pParams[1].data = NULL; 
	pParams[2].tag  = FT_PARAM_TAG_IGNORE_PREFERRED_FAMILY;
	pParams[2].data = NULL; 
	pParams[3].tag  = FT_PARAM_TAG_IGNORE_PREFERRED_SUBFAMILY;
	pParams[3].data = NULL; 

	oOpenArgs.params = pParams;
	oOpenArgs.num_params = 4;

	FT_Face face;
    int error = FT_Open_Face( library, &oOpenArgs, face_index, &face );
	
	ft_sfree(pParams);
	
	if (error)
		return NULL;
	
	return face;
}

unsigned int ASC_FT_SetCMapForCharCode(FT_Face face, unsigned int unicode)
{	
	if (!face)
		return 0;

	if ( 0 == face->num_charmaps )
		return unicode;

    unsigned int nCharIndex = 0;

	for ( int nIndex = 0; nIndex < face->num_charmaps; ++nIndex )
	{
		FT_CharMap pCharMap = face->charmaps[nIndex];

		if ( FT_Set_Charmap( face, pCharMap ) )
			continue;

		FT_Encoding pEncoding = pCharMap->encoding;

		if ( FT_ENCODING_UNICODE == pEncoding )
		{
			nCharIndex = FT_Get_Char_Index( face, unicode );
			if ( nCharIndex )
			{				
				return nCharIndex;
			}
		}
		else if ( FT_ENCODING_NONE == pEncoding || FT_ENCODING_MS_SYMBOL == pEncoding || FT_ENCODING_APPLE_ROMAN == pEncoding )
		{
#if 0
			FT_ULong  charcode;
			FT_UInt   gindex;

			charcode = FT_Get_First_Char( face, &gindex );                   
			while ( gindex != 0 )                                            
			{                                                               
				charcode = FT_Get_Next_Char( face, charcode, &gindex );       
				if ( charcode == unicode )
				{
					nCharIndex = gindex;
					break;
				}
			}   
#endif

			nCharIndex = FT_Get_Char_Index( face, unicode );
		}
	}

    return nCharIndex;
}

int* ASC_FT_GetFaceInfo(FT_Face face)
{
    if (!face)
        return NULL;

    //face->units_per_EM
    //face->ascender
    //face->descender
    //face->height
    //face->face_flags
    //face->num_faces
    //face->num_glyphs
    //face->num_charmaps
    //face->style_flags
    //face->face_index
    //face->family_name
    //face->style_name

    TT_OS2* os2 = (TT_OS2*)FT_Get_Sfnt_Table( face, ft_sfnt_os2 );
    //os2->version
    //os2->usWeightClass
    //os2->fsSelection
    //os2->usWinAscent
    //os2->usWinDescent
    //os2->usDefaultChar
    //os2->sTypoAscender;
    //os2->sTypoDescender;
    //os2->sTypoLineGap;

    //os2->ulUnicodeRange1
    //os2->ulUnicodeRange2
    //os2->ulUnicodeRange3
    //os2->ulUnicodeRange4
    //os2->ulCodePageRange1
    //os2->ulCodePageRange2

    int isSymbolic = -1;
    if (os2 && 0xFFFF != os2->version)
    {
        FT_ULong ulCodePageRange1 = os2->ulCodePageRange1;
        FT_ULong ulCodePageRange2 = os2->ulCodePageRange2;

        if ((ulCodePageRange1 & 0x80000000) || (ulCodePageRange1 == 0 && ulCodePageRange2 == 0))
        {
            for( int nIndex = 0; nIndex < face->num_charmaps; nIndex++ )
            {
                if (0 == face->charmaps[nIndex]->encoding_id && 3 == face->charmaps[nIndex]->platform_id)
                {
                    isSymbolic = nIndex;
                    break;
                }
            }
        }
    }

    int nHeader_yMin = face->descender;
    int nHeader_yMax = face->ascender;
    if (face && FT_IS_SFNT(face))
    {
        TT_Face ttface = (TT_Face)face;
        nHeader_yMin = ttface->header.yMin;
        nHeader_yMax = ttface->header.yMax;
    }

    //isSymbolic

    unsigned int nLen1 = (unsigned int)strlen(face->family_name);
    unsigned int nLen2 = (unsigned int)strlen(face->style_name);

    unsigned int nLen = 28 + nLen1 + 1 + nLen2 + 1 + 1 + (int)face->num_fixed_sizes;

    int* res = (int*)ASC_FT_Malloc(nLen * sizeof(int));
    int* resTmp = res;

    *resTmp++ = (int)face->units_per_EM;
    *resTmp++ = (int)face->ascender;
    *resTmp++ = (int)face->descender;
    *resTmp++ = (int)face->height;
    *resTmp++ = (int)face->face_flags;
    *resTmp++ = (int)face->num_faces;
    *resTmp++ = (int)face->num_glyphs;
    *resTmp++ = (int)face->num_charmaps;
    *resTmp++ = (int)face->style_flags;
    *resTmp++ = (int)face->face_index;

    for (unsigned int i = 0; i < nLen1; ++i)
        *resTmp++ = face->family_name[i];
    *resTmp++ = 0;

    for (unsigned int i = 0; i < nLen2; ++i)
        *resTmp++ = face->style_name[i];
    *resTmp++ = 0;

    if (os2)
    {
        *resTmp++ = (int)os2->version;
        *resTmp++ = (int)os2->usWeightClass;
        *resTmp++ = (int)os2->fsSelection;
        *resTmp++ = (int)os2->usWinAscent;
        *resTmp++ = (int)os2->usWinDescent;
        *resTmp++ = (int)os2->usDefaultChar;
        *resTmp++ = (int)os2->sTypoAscender;
        *resTmp++ = (int)os2->sTypoDescender;
        *resTmp++ = (int)os2->sTypoLineGap;

        *resTmp++ = (int)os2->ulUnicodeRange1;
        *resTmp++ = (int)os2->ulUnicodeRange2;
        *resTmp++ = (int)os2->ulUnicodeRange3;
        *resTmp++ = (int)os2->ulUnicodeRange4;
        *resTmp++ = (int)os2->ulCodePageRange1;
        *resTmp++ = (int)os2->ulCodePageRange2;
    }
    else
    {
        *resTmp++ = (int)0xFFFF;
        *resTmp++ = (int)0;
        *resTmp++ = (int)0;
        *resTmp++ = (int)0;
        *resTmp++ = (int)0;
        *resTmp++ = (int)0;
        *resTmp++ = (int)0;
        *resTmp++ = (int)0;
        *resTmp++ = (int)0;

        *resTmp++ = (int)0;
        *resTmp++ = (int)0;
        *resTmp++ = (int)0;
        *resTmp++ = (int)0;
        *resTmp++ = (int)0;
        *resTmp++ = (int)0;
    }

    *resTmp++ = (int)isSymbolic;
    *resTmp++ = (int)nHeader_yMin;
    *resTmp++ = (int)nHeader_yMax;

    *resTmp++ = (int)face->num_fixed_sizes;

    for (int i = 0; i < face->num_fixed_sizes; ++i)
        *resTmp++ = (int)face->available_sizes[i].size;

    return res;
}

int ASC_FT_GetFaceMaxAdvanceX(FT_Face face)
{
    if (!face || !face->size)
        return 0;

    return (int)face->size->metrics.max_advance;
}

int ASC_FT_GetKerningX(FT_Face face, unsigned int prev_gid, unsigned int gid)
{
    FT_Vector vec;
    vec.x = 0;
    vec.y = 0;
    FT_Get_Kerning(face, prev_gid, gid, 0, &vec);
    return vec.x;
}

int* ASC_FT_Glyph_Get_CBox(FT_Glyph glyph, FT_UInt bbox_mode)
{
    FT_BBox bbox;
    FT_Glyph_Get_CBox(glyph, bbox_mode, &bbox);
    int* res = (int*)ASC_FT_Malloc(4 * sizeof(int));
    res[0] = bbox.xMin;
    res[1] = bbox.yMin;
    res[2] = bbox.xMax;
    res[3] = bbox.yMax;
    return res;
}

////////////////////////////////////////////////////////////////////////////////
// outline
typedef struct  FT_Decompose_Outline_Buffer_
{
  FT_Pos* buffer;
  FT_Int size;
  FT_Int pos;
} FT_Decompose_Outline_Buffer;

void FT_Decompose_Outline_Buffer_Init(FT_Decompose_Outline_Buffer* buffer)
{
    buffer->buffer = NULL;
    buffer->size = 0;
    buffer->pos = 0;
}

void FT_Decompose_Outline_Buffer_Check(FT_Decompose_Outline_Buffer* buffer, FT_Int add)
{
    if ((buffer->pos + add) < buffer->size)
        return;

    if (NULL == buffer->buffer)
    {
        buffer->buffer = (FT_Pos*)ft_smalloc(200 * sizeof(FT_Pos));
        buffer->size = 200;
        buffer->pos = 0;
        return;
    }

    FT_Int sizeNew = 2 * buffer->size;
    FT_Pos* bufferNew = (FT_Pos*)ft_smalloc((size_t)sizeNew * sizeof(FT_Pos));
    memcpy(bufferNew, buffer->buffer, (size_t)buffer->pos * sizeof(FT_Pos));
    ft_sfree(buffer->buffer);
    buffer->buffer = bufferNew;
    buffer->size = sizeNew;
    // pos
}

int GlyphPathMoveTo(const FT_Vector *point, void *user)
{
    FT_Decompose_Outline_Buffer* buffer = (FT_Decompose_Outline_Buffer*)user;
    FT_Decompose_Outline_Buffer_Check(buffer, 3);
    buffer->buffer[buffer->pos++] = 0;
    buffer->buffer[buffer->pos++] = point->x;
    buffer->buffer[buffer->pos++] = point->y;
    return 0;
}

int GlyphPathLineTo(const FT_Vector *point, void *user)
{
    FT_Decompose_Outline_Buffer* buffer = (FT_Decompose_Outline_Buffer*)user;
    FT_Decompose_Outline_Buffer_Check(buffer, 3);
    buffer->buffer[buffer->pos++] = 1;
    buffer->buffer[buffer->pos++] = point->x;
    buffer->buffer[buffer->pos++] = point->y;
    return 0;
}

int GlyphPathConicTo(const FT_Vector *pControlPoint, const FT_Vector *pEndPoint, void *user)
{
    FT_Decompose_Outline_Buffer* buffer = (FT_Decompose_Outline_Buffer*)user;
    FT_Decompose_Outline_Buffer_Check(buffer, 5);
    buffer->buffer[buffer->pos++] = 2;
    buffer->buffer[buffer->pos++] = pControlPoint->x;
    buffer->buffer[buffer->pos++] = pControlPoint->y;
    buffer->buffer[buffer->pos++] = pEndPoint->x;
    buffer->buffer[buffer->pos++] = pEndPoint->y;
    return 0;
}

int GlyphPathCubicTo(const FT_Vector *pFirstControlPoint, const FT_Vector *pSecondControlPoint, const FT_Vector *pEndPoint, void *user)
{
    FT_Decompose_Outline_Buffer* buffer = (FT_Decompose_Outline_Buffer*)user;
    FT_Decompose_Outline_Buffer_Check(buffer, 7);
    buffer->buffer[buffer->pos++] = 3;
    buffer->buffer[buffer->pos++] = pFirstControlPoint->x;
    buffer->buffer[buffer->pos++] = pFirstControlPoint->y;
    buffer->buffer[buffer->pos++] = pSecondControlPoint->x;
    buffer->buffer[buffer->pos++] = pSecondControlPoint->y;
    buffer->buffer[buffer->pos++] = pEndPoint->x;
    buffer->buffer[buffer->pos++] = pEndPoint->y;
    return 0;
}

/////////////////////////////////////////////////////////////////////

int* ASC_FT_Get_Glyph_Measure_Params(FT_Face face, int isVector)
{
    FT_GlyphSlot slot = face->glyph;

    if (!isVector && slot->bitmap.buffer != NULL && slot->format == FT_GLYPH_FORMAT_BITMAP)
    {
        int* res = (int*)ASC_FT_Malloc(15 * sizeof(int));
        res[0] = 15;
        res[1] = 0;
        res[2] = 0;
        res[3] = slot->metrics.width;
        res[4] = slot->metrics.height;

        res[5] = slot->metrics.width;
        res[6] = slot->metrics.height;

        res[7] = slot->metrics.horiAdvance;
        res[8] = slot->metrics.horiBearingX;
        res[9] = slot->metrics.horiBearingY;

        res[10] = slot->metrics.vertAdvance;
        res[11] = slot->metrics.vertBearingX;
        res[12] = slot->metrics.vertBearingY;

        res[13] = slot->linearHoriAdvance;
        res[14] = slot->linearVertAdvance;
        return res;
    }

    FT_Glyph glyph;
    FT_Get_Glyph(slot, &glyph);
    if (!glyph)
        return NULL;

    FT_Decompose_Outline_Buffer buffer;
    FT_Decompose_Outline_Buffer_Init(&buffer);
    FT_Decompose_Outline_Buffer_Check(&buffer, 15);

    FT_Pos* _buffer = buffer.buffer;
    _buffer[0] = 0;

    FT_BBox bbox;
    FT_Glyph_Get_CBox(glyph, 1, &bbox);
    _buffer[1] = bbox.xMin;
    _buffer[2] = bbox.yMin;
    _buffer[3] = bbox.xMax;
    _buffer[4] = bbox.yMax;

    _buffer[5] = slot->metrics.width;
    _buffer[6] = slot->metrics.height;

    _buffer[7] = slot->metrics.horiAdvance;
    _buffer[8] = slot->metrics.horiBearingX;
    _buffer[9] = slot->metrics.horiBearingY;

    _buffer[10] = slot->metrics.vertAdvance;
    _buffer[11] = slot->metrics.vertBearingX;
    _buffer[12] = slot->metrics.vertBearingY;

    _buffer[13] = slot->linearHoriAdvance;
    _buffer[14] = slot->linearVertAdvance;

    buffer.pos = 15;

    if (isVector)
    {
        static FT_Outline_Funcs pOutlineFuncs =
        {
            &GlyphPathMoveTo,
            &GlyphPathLineTo,
            &GlyphPathConicTo,
            &GlyphPathCubicTo,
            0, 0
        };

        FT_Outline_Decompose(&((FT_OutlineGlyph)glyph)->outline, &pOutlineFuncs, &buffer);
    }

    buffer.buffer[0] = buffer.pos;

    FT_Done_Glyph(glyph);
    return (int*)buffer.buffer;
}

int* ASC_FT_Get_Glyph_Render_Params(FT_Face face, int render_mode)
{
    FT_GlyphSlot slot = face->glyph;
    if (FT_Render_Glyph(slot, render_mode))
        return NULL;

    int* res = (int*)ASC_FT_Malloc(6 * sizeof(int));
    res[0] = slot->bitmap_left;
    res[1] = slot->bitmap_top;
    res[2] = (int)slot->bitmap.width;
    res[3] = (int)slot->bitmap.rows;
    res[4] = slot->bitmap.pitch;
    res[5] = slot->bitmap.pixel_mode;
    return res;
}

unsigned char* ASC_FT_Get_Glyph_Render_Buffer(FT_Face face)
{
    return face->glyph->bitmap.buffer;
}

void ASC_FT_Set_Transform(FT_Face face, int xx, int yx, int xy, int yy)
{
    FT_Matrix m;
    m.xx = xx;
    m.yx = yx;
    m.xy = xy;
    m.yy = yy;
    FT_Set_Transform(face, &m, NULL);
}

int ASC_FT_Set_TrueType_HintProp(FT_Library library, unsigned int interpreter_version)
{
    FT_UInt _interpreter_version = interpreter_version;
    return FT_Property_Set(library, "truetype", "interpreter-version", &_interpreter_version);
}
