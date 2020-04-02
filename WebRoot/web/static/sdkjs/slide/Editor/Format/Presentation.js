/*
 * (c) Copyright Ascensio System SIA 2010-2019
 *
 * This program is a free software product. You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License (AGPL)
 * version 3 as published by the Free Software Foundation. In accordance with
 * Section 7(a) of the GNU AGPL its Section 15 shall be amended to the effect
 * that Ascensio System SIA expressly excludes the warranty of non-infringement
 * of any third-party rights.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR  PURPOSE. For
 * details, see the GNU AGPL at: http://www.gnu.org/licenses/agpl-3.0.html
 *
 * You can contact Ascensio System SIA at 20A-12 Ernesta Birznieka-Upisha
 * street, Riga, Latvia, EU, LV-1050.
 *
 * The  interactive user interfaces in modified source and object code versions
 * of the Program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU AGPL version 3.
 *
 * Pursuant to Section 7(b) of the License you must retain the original Product
 * logo when distributing the program. Pursuant to Section 7(e) we decline to
 * grant you any rights under trademark law for use of our trademarks.
 *
 * All the Product's GUI elements, including illustrations and icon sets, as
 * well as technical writing content are licensed under the terms of the
 * Creative Commons Attribution-ShareAlike 4.0 International. See the License
 * terms at http://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
 */

"use strict";

// Import
var align_Left = AscCommon.align_Left;
var align_Justify = AscCommon.align_Justify;
var vertalign_Baseline = AscCommon.vertalign_Baseline;
var changestype_Drawing_Props = AscCommon.changestype_Drawing_Props;
var g_oTableId = AscCommon.g_oTableId;
var isRealObject = AscCommon.isRealObject;
var History = AscCommon.History;

var CreateUnifillSolidFillSchemeColor = AscFormat.CreateUnifillSolidFillSchemeColor;

function DrawingCopyObject(Drawing, X, Y, ExtX, ExtY, ImageUrl) {
    this.Drawing = Drawing;
    this.X = X;
    this.Y = Y;
    this.ExtX = ExtX;
    this.ExtY = ExtY;
    this.ImageUrl = ImageUrl;
}

DrawingCopyObject.prototype.copy = function (oIdMap) {

    var _copy = this.Drawing;
    var oPr = new AscFormat.CCopyObjectProperties();
    oPr.idMap = oIdMap;
    if (this.Drawing) {
        _copy = this.Drawing.copy(oPr);
        if (AscCommon.isRealObject(oIdMap)) {
            oIdMap[this.Drawing.Id] = _copy.Id;
        }
    }
    return new DrawingCopyObject(this.Drawing ? _copy : this.Drawing, this.X, this.Y, this.ExtX, this.ExtY, this.ImageUrl);

};

function PresentationSelectedContent() {
    this.SlideObjects = [];
    this.Notes = [];
    this.NotesMasters = [];
    this.NotesMastersIndexes = [];
    this.NotesThemes = [];
    this.LayoutsIndexes = [];
    this.Layouts = [];
    this.MastersIndexes = [];
    this.Masters = [];
    this.ThemesIndexes = [];
    this.Themes = [];
    this.Drawings = [];
    this.DocContent = null;
    this.PresentationWidth = null;
    this.PresentationHeight = null;
    this.ThemeName = null;
}

PresentationSelectedContent.prototype.copy = function () {
    var ret = new PresentationSelectedContent(), i, oIdMap, oSlide, oNotes, oNotesMaster, oLayout, aElements,
        oSelectedElement, oElement, oParagraph;
    for (i = 0; i < this.SlideObjects.length; ++i) {
        oIdMap = {};
        oSlide = this.SlideObjects[i].createDuplicate(oIdMap);
        AscFormat.fResetConnectorsIds(oSlide.cSld.spTree, oIdMap);
        ret.SlideObjects.push(oSlide);
    }
    for (i = 0; i < this.Notes.length; ++i) {
        oIdMap = {};
        oNotes = this.Notes[i].createDuplicate(oIdMap);
        AscFormat.fResetConnectorsIds(oNotes.cSld.spTree, oIdMap);
        ret.Notes.push(oNotes);
    }
    for (i = 0; i < this.NotesMasters.length; ++i) {
        oIdMap = {};
        oNotesMaster = this.NotesMasters[i].createDuplicate(oIdMap);
        AscFormat.fResetConnectorsIds(oNotesMaster.cSld.spTree, oIdMap);
        ret.NotesMasters.push(oNotesMaster);
    }
    for (i = 0; i < this.NotesMastersIndexes.length; ++i) {
        ret.NotesMastersIndexes.push(this.NotesMastersIndexes[i]);
    }
    for (i = 0; i < this.NotesThemes.length; ++i) {
        ret.NotesThemes.push(this.NotesThemes[i].createDuplicate());
    }
    for (i = 0; i < this.LayoutsIndexes.length; ++i) {
        ret.LayoutsIndexes.push(this.LayoutsIndexes[i]);
    }
    for (i = 0; i < this.Layouts.length; ++i) {
        oIdMap = {};
        oLayout = this.Layouts[i].createDuplicate(oIdMap);
        AscFormat.fResetConnectorsIds(oLayout.cSld.spTree, oIdMap);
        ret.Layouts.push(oLayout);
    }
    for (i = 0; i < this.MastersIndexes.length; ++i) {
        ret.MastersIndexes.push(this.MastersIndexes[i]);
    }

    for (i = 0; i < this.Masters.length; ++i) {
        oIdMap = {};
        oNotesMaster = this.Masters[i].createDuplicate(oIdMap);
        AscFormat.fResetConnectorsIds(oNotesMaster.cSld.spTree, oIdMap);
        ret.Masters.push(oNotesMaster);
    }

    for (i = 0; i < this.ThemesIndexes.length; ++i) {
        ret.ThemesIndexes.push(this.ThemesIndexes[i]);
    }
    for (i = 0; i < this.Themes.length; ++i) {
        ret.Themes.push(this.Themes[i].createDuplicate());
    }


    oIdMap = {};
    var oPr = new AscFormat.CCopyObjectProperties();
    oPr.idMap = oIdMap;
    var aDrawingsCopy = [];
    for (i = 0; i < this.Drawings.length; ++i) {
        ret.Drawings.push(this.Drawings[i].copy(oPr));
        if (ret.Drawings[ret.Drawings.length - 1].Drawing) {
            aDrawingsCopy.push(ret.Drawings[ret.Drawings.length - 1].Drawing);
        }
    }
    AscFormat.fResetConnectorsIds(aDrawingsCopy, oIdMap);
    if (this.DocContent) {
        //TODO: перенести копирование в CSelectedContent;
        ret.DocContent = new CSelectedContent();
        aElements = this.DocContent.Elements;
        for (i = 0; i < aElements.length; ++i) {
            oSelectedElement = new CSelectedElement();
            oElement = aElements[i];
            oParagraph = aElements[i].Element;
            oSelectedElement.SelectedAll = oElement.SelectedAll;

            oSelectedElement.Element = oParagraph.Copy(oParagraph.Parent, oParagraph.DrawingDocument, {});
            ret.DocContent.Elements[i] = oSelectedElement;
        }
    }
    ret.PresentationWidth = this.PresentationWidth;
    ret.PresentationHeight = this.PresentationHeight;
    ret.ThemeName = this.ThemeName;
    return ret;
};

PresentationSelectedContent.prototype.getContentType = function () {
    if (this.SlideObjects.length > 0) {
        return 1;
    } else if (this.Drawings.length > 0) {
        return 2;
    } else if (this.DocContent) {
        return 3;
    }
    return 0;
};

function CreatePresentationTableStyles(Styles, IdMap) {
    function CreateThemedStyle1(schemeId) {
        if (schemeId == 8)
            var style = new CStyle("Themed Style 1", null, null, styletype_Table);
        else
            var style = new CStyle("Themed Style 1 - Accent " + (schemeId + 1), null, null, styletype_Table);
        style.TablePr.Set_FromObject(
            {
                TableBorders:
                    {
                        Left:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            },

                        Right:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            },

                        Top:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            },

                        Bottom:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            },

                        InsideH:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            },

                        InsideV:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            }
                    }
            }
        );
        style.TableWholeTable.Set_FromObject(
            {
                TextPr:
                    {
                        FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                        Unifill: CreateUnifillSolidFillSchemeColor(8, 0)
                    },
                TableCellPr:
                    {
                        Shd:
                            {
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0.6)
                            }
                    }
            }
        );
        var styleObject = {
            TableCellPr:
                {
                    Shd:
                        {
                            Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0.8)
                        }
                }
        };
        style.TableBand1Horz.Set_FromObject(styleObject);
        style.TableBand1Vert.Set_FromObject(styleObject);

        styleObject = {
            TextPr:
                {
                    Bold: true,
                    FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                    Unifill: CreateUnifillSolidFillSchemeColor(8, 0)
                },
            TableCellPr:
                {}
        };
        style.TableLastCol.Set_FromObject(styleObject);
        style.TableFirstCol.Set_FromObject(styleObject);

        var styleLastRowObject = {
            TableCellPr:
                {},
            TextPr:
                {
                    Bold: true,
                    FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                    Unifill: CreateUnifillSolidFillSchemeColor(8, 0)
                }
        }
        styleLastRowObject.TableCellPr.TableCellBorders =
            {
                Right:
                    {
                        Color: {r: 0, g: 0, b: 0},
                        Unifill: CreateUnifillSolidFillSchemeColor(12, 0),
                        Space: 0,
                        Size: 12700 / 36000,
                        Value: border_None
                    },
                Left:
                    {
                        Color: {r: 0, g: 0, b: 0},
                        Unifill: CreateUnifillSolidFillSchemeColor(12, 0),
                        Space: 0,
                        Size: 12700 / 36000,
                        Value: border_None
                    },

            };
        style.TableLastRow.Set_FromObject(styleLastRowObject);
        styleObject.TableCellPr.Shd =
            {
                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0)
            }
        styleObject.TableCellPr.TableCellBorders =
            {
                Bottom:
                    {
                        Color: {r: 0, g: 0, b: 0},
                        Unifill: CreateUnifillSolidFillSchemeColor(12, 0),
                        Space: 0,
                        Size: 12700 / 36000,
                        Value: border_Single
                    }
            };
        styleObject.TextPr =
            {
                Bold: true,
                FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                Unifill: CreateUnifillSolidFillSchemeColor(12, 0)
            };
        style.TableFirstRow.Set_FromObject(styleObject);
        return style;
    }

    function CreateThemedStyle2(schemeId) {
        if (schemeId == 8)
            var style = new CStyle("Themed Style 2", null, null, styletype_Table);
        else
            var style = new CStyle("Themed Style 2 - Accent " + (schemeId + 1), null, null, styletype_Table);
        style.TablePr.Set_FromObject(
            {
                TableBorders:
                    {
                        Left:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            },

                        Right:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            },

                        Top:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            },

                        Bottom:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            },

                        InsideH:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            },

                        InsideV:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            }
                    }
            }
        );
        style.TableWholeTable.Set_FromObject(
            {
                TextPr:
                    {
                        FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                        Unifill: CreateUnifillSolidFillSchemeColor(12, 0)
                    },
                TableCellPr:
                    {
                        Shd:
                            {
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0)
                            }
                    }
            }
        );
        var styleObject = {
            TableCellPr:
                {
                    Shd:
                        {
                            Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0.8)
                        }
                }
        };
        style.TableBand1Horz.Set_FromObject(styleObject);
        style.TableBand1Vert.Set_FromObject(styleObject);

        styleObject = {
            TextPr:
                {
                    Bold: true,
                    FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                    Unifill: CreateUnifillSolidFillSchemeColor(12, 0)
                },
            TableCellPr:
                {}
        };
        style.TableLastCol.Set_FromObject(styleObject);
        style.TableFirstCol.Set_FromObject(styleObject);
        styleObject.TableCellPr.Shd =
            {
                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0)
            }
        styleObject.TableCellPr.TableCellBorders =
            {
                Top:
                    {
                        Color: {r: 0, g: 0, b: 0},
                        Unifill: CreateUnifillSolidFillSchemeColor(12, 0),
                        Space: 0,
                        Size: 12700 / 36000,
                        Value: border_Single
                    }
            };
        style.TableLastRow.Set_FromObject(styleObject);
        styleObject.TableCellPr.TableCellBorders =
            {
                Bottom:
                    {
                        Color: {r: 0, g: 0, b: 0},
                        Unifill: CreateUnifillSolidFillSchemeColor(12, 0),
                        Space: 0,
                        Size: 12700 / 36000,
                        Value: border_Single
                    }
            };
        styleObject.TextPr =
            {
                Bold: true,
                FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                Unifill: CreateUnifillSolidFillSchemeColor(12, 0)
            };
        style.TableFirstRow.Set_FromObject(styleObject);
        return style;
    }

    function CreateLightStyle1(schemeId) {
        if (schemeId == 8)
            var style = new CStyle("Light Style 1", null, null, styletype_Table);
        else
            var style = new CStyle("Light Style 1 - Accent " + (schemeId + 1), null, null, styletype_Table);
        style.TablePr.Set_FromObject(
            {
                TableBorders:
                    {
                        Left:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            },

                        Right:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            },

                        Top:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            },

                        Bottom:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            },

                        InsideH:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            },

                        InsideV:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            }
                    }
            }
        );
        style.TableWholeTable.Set_FromObject(
            {
                TextPr:
                    {
                        FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                        Unifill: CreateUnifillSolidFillSchemeColor(8, 0)
                    },
                TableCellPr:
                    {
                        Shd:
                            {
                                Unifill: CreateUnifillSolidFillSchemeColor(12, 0)
                            }
                    }
            }
        );
        var styleObject = {
            TableCellPr:
                {
                    Shd:
                        {
                            Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0.4)
                        }
                }
        };
        style.TableBand1Horz.Set_FromObject(styleObject);
        style.TableBand1Vert.Set_FromObject(styleObject);

        styleObject = {
            TextPr:
                {
                    Bold: true,
                    FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                    Unifill: CreateUnifillSolidFillSchemeColor(8, 0)
                },
            TableCellPr:
                {}
        };
        style.TableLastCol.Set_FromObject(styleObject);
        style.TableFirstCol.Set_FromObject(styleObject);

        styleObject.TableCellPr.TableCellBorders =
            {
                Top:
                    {
                        Color: {r: 0, g: 0, b: 0},
                        Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                        Space: 0,
                        Size: 12700 / 36000,
                        Value: border_Single
                    }
            };
        style.TableLastRow.Set_FromObject(styleObject);
        styleObject.TableCellPr.TableCellBorders =
            {
                Bottom:
                    {
                        Color: {r: 0, g: 0, b: 0},
                        Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                        Space: 0,
                        Size: 12700 / 36000,
                        Value: border_Single
                    }
            };
        styleObject.TextPr =
            {
                Bold: true,
                FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                Unifill: CreateUnifillSolidFillSchemeColor(8, 0)
            };
        styleObject.TableCellPr.Shd =
            {
                Unifill: CreateUnifillSolidFillSchemeColor(12, 0)
            }
        style.TableFirstRow.Set_FromObject(styleObject);
        return style;
    }

    function CreateLightStyle2(schemeId) {
        if (schemeId == 8)
            var style = new CStyle("Light Style 2", null, null, styletype_Table);
        else
            var style = new CStyle("Light Style 2 - Accent " + (schemeId + 1), null, null, styletype_Table);
        style.TablePr.Set_FromObject(
            {
                TableBorders:
                    {
                        Left:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            },

                        Right:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            },

                        Top:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            },

                        Bottom:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            },

                        InsideH:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            },

                        InsideV:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            }
                    }
            }
        );
        style.TableWholeTable.Set_FromObject(
            {
                TextPr:
                    {
                        FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                        Unifill: CreateUnifillSolidFillSchemeColor(8, 0)
                    },
                TableCellPr:
                    {
                        Shd:
                            {
                                Unifill: CreateUnifillSolidFillSchemeColor(12, 0)
                            }
                    }
            }
        );
        var styleObject = {
            TableCellPr:
                {
                    Shd:
                        {
                            Unifill: CreateUnifillSolidFillSchemeColor(12, 0)
                        },
                    TableCellBorders:
                        {
                            Top:
                                {
                                    Color: {r: 0, g: 0, b: 0},
                                    Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                    Space: 0,
                                    Size: 12700 / 36000,
                                    Value: border_Single
                                },
                            Bottom:
                                {
                                    Color: {r: 0, g: 0, b: 0},
                                    Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                    Space: 0,
                                    Size: 12700 / 36000,
                                    Value: border_Single
                                }
                        },
                }
        };
        var styleTableBand1Vert =
            {
                TableCellPr:
                    {
                        TableCellBorders:
                            {
                                Left:
                                    {
                                        Color: {r: 0, g: 0, b: 0},
                                        Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                        Space: 0,
                                        Size: 12700 / 36000,
                                        Value: border_Single
                                    },
                                Right:
                                    {
                                        Color: {r: 0, g: 0, b: 0},
                                        Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                        Space: 0,
                                        Size: 12700 / 36000,
                                        Value: border_Single
                                    }
                            }
                    }
            }
        style.TableBand1Horz.Set_FromObject(styleObject);
        style.TableBand1Vert.Set_FromObject(styleTableBand1Vert);

        styleObject = {
            TextPr:
                {
                    Bold: true,
                    FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                    Unifill: CreateUnifillSolidFillSchemeColor(8, 0)
                },
            TableCellPr:
                {}
        };
        style.TableLastCol.Set_FromObject(styleObject);
        style.TableFirstCol.Set_FromObject(styleObject);

        styleObject.TableCellPr.TableCellBorders =
            {
                Top:
                    {
                        Color: {r: 0, g: 0, b: 0},
                        Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                        Space: 0,
                        Size: 38100 / 36000,
                        Value: border_Single
                    }
            };
        styleObject.TableCellPr.Shd =
            {
                Unifill: CreateUnifillSolidFillSchemeColor(12, 0)
            }
        style.TableLastRow.Set_FromObject(styleObject);
        styleObject.TableCellPr.TableCellBorders =
            {
                Bottom:
                    {
                        Color: {r: 0, g: 0, b: 0},
                        Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                        Space: 0,
                        Size: 12700 / 36000,
                        Value: border_Single
                    }
            };
        styleObject.TextPr =
            {
                Bold: true,
                FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                Unifill: CreateUnifillSolidFillSchemeColor(12, 0)
            };

        styleObject.TableCellPr.Shd =
            {
                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0)
            }

        style.TableFirstRow.Set_FromObject(styleObject);
        return style;
    }

    function CreateLightStyle3(schemeId) {
        if (schemeId == 8)
            var style = new CStyle("Light Style 3", null, null, styletype_Table);
        else
            var style = new CStyle("Light Style 3 - Accent " + (schemeId + 1), null, null, styletype_Table);
        style.TablePr.Set_FromObject(
            {
                TableBorders:
                    {
                        Left:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            },

                        Right:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            },

                        Top:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            },

                        Bottom:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            },

                        InsideH:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            },

                        InsideV:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            }
                    }
            }
        );
        style.TableWholeTable.Set_FromObject(
            {
                TextPr:
                    {
                        FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                        Unifill: CreateUnifillSolidFillSchemeColor(8, 0)
                    },
                TableCellPr:
                    {
                        Shd:
                            {
                                Unifill: CreateUnifillSolidFillSchemeColor(12, 0)
                            }
                    }
            }
        );
        var styleObject = {
            TableCellPr:
                {
                    Shd:
                        {
                            Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0.2)
                        }
                }
        };
        style.TableBand1Horz.Set_FromObject(styleObject);
        style.TableBand1Vert.Set_FromObject(styleObject);

        styleObject = {
            TextPr:
                {
                    Bold: true,
                    FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                    Unifill: CreateUnifillSolidFillSchemeColor(8, 0)
                },
            TableCellPr:
                {}
        };
        style.TableLastCol.Set_FromObject(styleObject);
        style.TableFirstCol.Set_FromObject(styleObject);

        styleObject.TableCellPr.TableCellBorders =
            {
                Top:
                    {
                        Color: {r: 0, g: 0, b: 0},
                        Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                        Space: 0,
                        Size: 38100 / 36000,
                        Value: border_Single
                    }
            };

        styleObject.TableCellPr.Shd =
            {
                Shd:
                    {
                        Unifill: CreateUnifillSolidFillSchemeColor(12, 0)
                    }
            };

        style.TableLastRow.Set_FromObject(styleObject);

        styleObject.TableCellPr.TableCellBorders =
            {
                Bottom:
                    {
                        Color: {r: 0, g: 0, b: 0},
                        Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                        Space: 0,
                        Size: 38100 / 36000,
                        Value: border_Single
                    }
            };

        styleObject.TextPr =
            {
                Bold: true,
                FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                Unifill: CreateUnifillSolidFillSchemeColor(8, 0)
            };
        style.TableFirstRow.Set_FromObject(styleObject);
        return style;
    }

    function CreateMediumStyle1(schemeId) {

        if (schemeId == 8)
            var style = new CStyle("Medium Style 1", null, null, styletype_Table);
        else
            var style = new CStyle("Medium Style 1 - Accent " + (schemeId + 1), null, null, styletype_Table);

        style.TablePr.Set_FromObject(
            {
                TableBorders:
                    {
                        Left:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            },

                        Right:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            },

                        Top:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            },

                        Bottom:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            },

                        InsideH:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            },

                        InsideV:
                            {
                                Value: border_None
                            }
                    }
            }
        );
        style.TableWholeTable.Set_FromObject(
            {
                TextPr:
                    {
                        FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                        Unifill: CreateUnifillSolidFillSchemeColor(8, 0)
                    },
                TableCellPr:
                    {
                        Shd:
                            {
                                Unifill: CreateUnifillSolidFillSchemeColor(12, 0)
                            }
                    }
            }
        );
        var styleObject = {
            TableCellPr:
                {
                    Shd:
                        {
                            Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0.2)
                        }
                }
        };
        style.TableBand1Horz.Set_FromObject(styleObject);
        style.TableBand1Vert.Set_FromObject(styleObject);

        styleObject = {
            TextPr:
                {
                    Bold: true,
                    FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                    Unifill: CreateUnifillSolidFillSchemeColor(8, 0)
                },
            TableCellPr:
                {}
        };
        style.TableLastCol.Set_FromObject(styleObject);
        style.TableFirstCol.Set_FromObject(styleObject);

        styleObject.TableCellPr.TableCellBorders =
            {
                Top:
                    {
                        Color: {r: 0, g: 0, b: 0},
                        Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                        Space: 0,
                        Size: 38100 / 36000,
                        Value: border_Single
                    }
            };
        styleObject.TableCellPr.Shd =
            {
                Unifill: CreateUnifillSolidFillSchemeColor(12, 0)
            }
        style.TableLastRow.Set_FromObject(styleObject);

        styleObject.TableCellPr.TableCellBorders =
            {
                Top:
                    {
                        Value: border_None
                    }
            };
        styleObject.TableCellPr.Shd =
            {
                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0)
            }
        styleObject.TableCellPr.TableCellBorders =
            {
                Bottom:
                    {
                        Color: {r: 0, g: 0, b: 0},
                        Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                        Space: 0,
                        Size: 38100 / 36000,
                        Value: border_Single
                    }
            };
        styleObject.TextPr =
            {
                Bold: true,
                FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                Unifill: CreateUnifillSolidFillSchemeColor(12, 0)
            };
        style.TableFirstRow.Set_FromObject(styleObject);
        return style;
    }

    function CreateMediumStyle2(schemeId) {
        if (schemeId == 8)
            var style = new CStyle("Medium Style 2", null, null, styletype_Table);
        else
            var style = new CStyle("Medium Style 2 - Accent " + (schemeId + 1), null, null, styletype_Table);
        //style.Id = "{" + GUID() + "}";
        style.TablePr.Set_FromObject(
            {
                TableBorders:
                    {
                        Left:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(12, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            },

                        Right:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(12, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            },

                        Top:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(12, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            },

                        Bottom:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(12, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            },

                        InsideH:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(12, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            },

                        InsideV:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(12, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            }
                    }
            }
        );
        style.TableWholeTable.Set_FromObject(
            {
                TextPr:
                    {
                        FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                        Unifill: CreateUnifillSolidFillSchemeColor(8, 0)
                    },
                TableCellPr:
                    {
                        Shd:
                            {
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0.2)
                            }
                    }
            }
        );
        var styleObject = {
            TableCellPr:
                {
                    Shd:
                        {
                            Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0.4)
                        }
                }
        };
        style.TableBand1Horz.Set_FromObject(styleObject);
        style.TableBand1Vert.Set_FromObject(styleObject);

        styleObject = {
            TextPr:
                {
                    Bold: true,
                    FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                    Unifill: CreateUnifillSolidFillSchemeColor(12, 0)
                },
            TableCellPr:
                {
                    Shd:
                        {
                            Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0)
                        }
                }
        };

        style.TableLastCol.Set_FromObject(styleObject);
        style.TableFirstCol.Set_FromObject(styleObject);

        styleObject.TableCellPr.TableCellBorders =
            {
                Top:
                    {
                        Color: {r: 0, g: 0, b: 0},
                        Unifill: CreateUnifillSolidFillSchemeColor(12, 0),
                        Space: 0,
                        Size: 38100 / 36000,
                        Value: border_Single
                    }
            };

        style.TableLastRow.Set_FromObject(styleObject);
        styleObject.TableCellPr.TableCellBorders =
            {
                Bottom:
                    {
                        Color: {r: 0, g: 0, b: 0},
                        Unifill: CreateUnifillSolidFillSchemeColor(12, 0),
                        Space: 0,
                        Size: 38100 / 36000,
                        Value: border_Single
                    }
            };

        style.TableFirstRow.Set_FromObject(styleObject);
        return style;
    }

    function CreateMediumStyle3(schemeId) {
        if (schemeId == 8)
            var style = new CStyle("Medium Style 3", null, null, styletype_Table);
        else
            var style = new CStyle("Medium Style 3 - Accent " + (schemeId + 1), null, null, styletype_Table);
        style.TablePr.Set_FromObject(
            {
                TableBorders:
                    {
                        Left:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            },

                        Right:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            },

                        Top:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(8, 0),
                                Space: 0,
                                Size: 38100 / 36000,
                                Value: border_Single
                            },

                        Bottom:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(8, 0),
                                Space: 0,
                                Size: 38100 / 36000,
                                Value: border_Single
                            },

                        InsideH:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            },

                        InsideV:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            }
                    }
            }
        );
        style.TableWholeTable.Set_FromObject(
            {
                TextPr:
                    {
                        FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                        Unifill: CreateUnifillSolidFillSchemeColor(8, 0)
                    },
                TableCellPr:
                    {
                        Shd:
                            {
                                Unifill: CreateUnifillSolidFillSchemeColor(12, 0)
                            }
                    }
            }
        );
        var styleObject = {
            TableCellPr:
                {
                    Shd:
                        {
                            Unifill: CreateUnifillSolidFillSchemeColor(2, 0.2)
                        }
                }
        };
        style.TableBand1Horz.Set_FromObject(styleObject);
        style.TableBand1Vert.Set_FromObject(styleObject);

        styleObject = {
            TextPr:
                {
                    Bold: true,
                    FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                    Unifill: CreateUnifillSolidFillSchemeColor(12, 0)
                },
            TableCellPr:
                {
                    Shd:
                        {
                            Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0)
                        }
                }
        };
        style.TableLastCol.Set_FromObject(styleObject);
        style.TableFirstCol.Set_FromObject(styleObject);
        styleObject.TableCellPr.Shd =
            {
                Unifill: CreateUnifillSolidFillSchemeColor(12, 0)
            }
        styleObject.TableCellPr.TableCellBorders =
            {
                Top:
                    {
                        Color: {r: 0, g: 0, b: 0},
                        Unifill: CreateUnifillSolidFillSchemeColor(8, 0),
                        Space: 0,
                        Size: 38100 / 36000,
                        Value: border_Single
                    }
            };
        styleObject.TextPr =
            {
                Bold: true,
                FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                Unifill: CreateUnifillSolidFillSchemeColor(8, 0)
            },
            style.TableLastRow.Set_FromObject(styleObject);
        styleObject.TableCellPr.TableCellBorders =
            {
                Bottom:
                    {
                        Color: {r: 0, g: 0, b: 0},
                        Unifill: CreateUnifillSolidFillSchemeColor(8, 0),
                        Space: 0,
                        Size: 38100 / 36000,
                        Value: border_Single
                    }
            };
        styleObject.TextPr =
            {
                Bold: true,
                FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                Unifill: CreateUnifillSolidFillSchemeColor(12, 0)
            };
        styleObject.TableCellPr.Shd =
            {
                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0)
            }
        style.TableFirstRow.Set_FromObject(styleObject);
        return style;
    }

    function CreateMediumStyle4(schemeId) {
        if (schemeId == 8)
            var style = new CStyle("Medium Style 4", null, null, styletype_Table);
        else
            var style = new CStyle("Medium Style 4 - Accent " + (schemeId + 1), null, null, styletype_Table);
        style.TablePr.Set_FromObject(
            {
                TableBorders:
                    {
                        Left:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            },

                        Right:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            },

                        Top:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            },

                        Bottom:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            },

                        InsideH:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            },

                        InsideV:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            }
                    }
            }
        );
        style.TableWholeTable.Set_FromObject(
            {
                TextPr:
                    {
                        FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                        Unifill: CreateUnifillSolidFillSchemeColor(8, 0)
                    },
                TableCellPr:
                    {
                        Shd:
                            {
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0.2)
                            }
                    }
            }
        );
        var styleObject = {
            TableCellPr:
                {
                    Shd:
                        {
                            Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0.4)
                        }
                }
        };
        style.TableBand1Horz.Set_FromObject(styleObject);
        style.TableBand1Vert.Set_FromObject(styleObject);

        styleObject = {
            TextPr:
                {
                    Bold: true,
                    FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                    Unifill: CreateUnifillSolidFillSchemeColor(8, 0)
                },
            TableCellPr:
                {}
        };

        style.TableFirstCol.Set_FromObject(styleObject);
        style.TableLastCol.Set_FromObject(styleObject)

        styleObject.TableCellPr.TableCellBorders =
            {
                Top:
                    {
                        Color: {r: 0, g: 0, b: 0},
                        Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                        Space: 0,
                        Size: 38100 / 36000,
                        Value: border_Single
                    }
            };
        styleObject.TableCellPr.Shd =
            {
                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0.2)
            }
        style.TableLastRow.Set_FromObject(styleObject);
        styleObject.TableCellPr.TableCellBorders =
            {
                Bottom:
                    {
                        Color: {r: 0, g: 0, b: 0},
                        Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                        Space: 0,
                        Size: 12700 / 36000,
                        Value: border_Single
                    }
            };
        styleObject.TableCellPr.Shd =
            {
                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0.2)
            }
        styleObject.TextPr =
            {
                Bold: true,
                FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                Unifill: CreateUnifillSolidFillSchemeColor(8, 0)
            };
        style.TableFirstRow.Set_FromObject(styleObject);
        return style;
    }

    function CreateNoStyle1(schemeId) {

        var style = new CStyle("No Style, No Grid", null, null, styletype_Table);
        style.TablePr.Set_FromObject(
            {
                TableBorders:
                    {
                        Left:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            },

                        Right:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            },

                        Top:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            },

                        Bottom:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            },

                        InsideH:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            },

                        InsideV:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            }
                    }
            }
        );
        style.TableWholeTable.Set_FromObject(
            {
                TextPr:
                    {
                        FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                        Unifill: CreateUnifillSolidFillSchemeColor(8, 0)
                    },
                TableCellPr:
                    {
                        Shd:
                            {
                                Unifill: CreateUnifillSolidFillSchemeColor(12, 0)
                            }
                    }
            }
        );
        var styleObject = {
            TableCellPr:
                {
                    Shd:
                        {
                            Unifill: CreateUnifillSolidFillSchemeColor(12, 0)
                        }
                }
        };
        style.TableBand1Horz.Set_FromObject(styleObject);
        style.TableBand1Vert.Set_FromObject(styleObject);

        styleObject = {
            TextPr:
                {
                    Bold: true,
                    FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                    Unifill: CreateUnifillSolidFillSchemeColor(8, 0)
                },
            TableCellPr:
                {
                    Shd:
                        {
                            Unifill: CreateUnifillSolidFillSchemeColor(12, 0)
                        }
                }
        };
        style.TableLastCol.Set_FromObject(styleObject);
        style.TableFirstCol.Set_FromObject(styleObject);

        styleObject.TableCellPr.TableCellBorders =
            {
                Top:
                    {
                        Color: {r: 0, g: 0, b: 0},
                        Unifill: CreateUnifillSolidFillSchemeColor(12, 0),
                        Space: 0,
                        Size: 12700 / 36000,
                        Value: border_None
                    }
            };
        style.TableLastRow.Set_FromObject(styleObject);
        styleObject.TableCellPr.TableCellBorders =
            {
                Bottom:
                    {
                        Color: {r: 0, g: 0, b: 0},
                        Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                        Space: 0,
                        Size: 12700 / 36000,
                        Value: border_None
                    }
            };
        styleObject.TextPr =
            {
                Bold: true,
                FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                Unifill: CreateUnifillSolidFillSchemeColor(8, 0)
            };
        style.TableFirstRow.Set_FromObject(styleObject);
        return style;
    }

    function CreateDarkStyle1(schemeId) {
        if (schemeId == 8)
            var style = new CStyle("Dark Style 1", null, null, styletype_Table);
        else
            var style = new CStyle("Dark Style 1 - Accent " + (schemeId + 1), null, null, styletype_Table);
        style.TablePr.Set_FromObject(
            {
                TableBorders:
                    {
                        Left:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            },

                        Right:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            },

                        Top:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            },

                        Bottom:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            },

                        InsideH:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            },

                        InsideV:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            }
                    }
            }
        );
        style.TableWholeTable.Set_FromObject(
            {
                TextPr:
                    {
                        FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                        Unifill: CreateUnifillSolidFillSchemeColor(12, 0)
                    },
                TableCellPr:
                    {
                        Shd:
                            {
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0)
                            }
                    }
            }
        );
        var styleObject = {
            TableCellPr:
                {
                    Shd:
                        {
                            Unifill: CreateUnifillSolidFillSchemeColor(schemeId, -0.6)
                        }
                }
        };
        style.TableBand1Vert.Set_FromObject(styleObject);
        style.TableBand1Horz.Set_FromObject(styleObject);


        var styleFirstLastColumnObject = {
            TextPr:
                {
                    Bold: true,
                    FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                    Unifill: CreateUnifillSolidFillSchemeColor(12, 0)
                },
            TableCellPr:
                {
                    Shd:
                        {
                            Unifill: CreateUnifillSolidFillSchemeColor(schemeId, -0.6)
                        },
                    TableCellBorders:
                        {
                            Right:
                                {
                                    Color: {r: 0, g: 0, b: 0},
                                    Unifill: CreateUnifillSolidFillSchemeColor(12, 0),
                                    Space: 0,
                                    Size: 38100 / 36000,
                                    Value: border_Single
                                }
                        }
                }

        };
        style.TableFirstCol.Set_FromObject(styleFirstLastColumnObject);
        styleFirstLastColumnObject.TableCellPr.TableCellBorders = {
            Left:
                {
                    Color: {r: 0, g: 0, b: 0},
                    Unifill: CreateUnifillSolidFillSchemeColor(12, 0),
                    Space: 0,
                    Size: 38100 / 36000,
                    Value: border_Single
                },
            Right:
                {
                    Value: border_None
                }
        };
        style.TableLastCol.Set_FromObject(styleFirstLastColumnObject);

        var styleLastRowObject = {
            TextPr:
                {
                    Bold: true,
                    FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                    Unifill: CreateUnifillSolidFillSchemeColor(12, 0)
                },
            TableCellPr:
                {
                    Shd:
                        {
                            Unifill: CreateUnifillSolidFillSchemeColor(schemeId, -0.4)
                        },
                }
        };
        styleLastRowObject.TableCellPr.TableCellBorders = {
            Top:
                {
                    Color: {r: 0, g: 0, b: 0},
                    Unifill: CreateUnifillSolidFillSchemeColor(12, 0),
                    Space: 0,
                    Size: 38100 / 36000,
                    Value: border_Single
                }
        }
        style.TableLastRow.Set_FromObject(styleLastRowObject);

        var styleFirstRowObject = {
            TableCellPr:
                {
                    TextPr:
                        {
                            Bold: true,
                            FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                            Unifill: CreateUnifillSolidFillSchemeColor(12, 0)
                        },
                    Shd:
                        {
                            Unifill: CreateUnifillSolidFillSchemeColor(8, 0)
                        },
                    TableCellBorders:
                        {
                            Bottom:
                                {
                                    Color: {r: 0, g: 0, b: 0},
                                    Unifill: CreateUnifillSolidFillSchemeColor(12, 0),
                                    Space: 0,
                                    Size: 38100 / 36000,
                                    Value: border_Single
                                }
                        }
                }
        }
        style.TableFirstRow.Set_FromObject(styleFirstRowObject);
        return style;
    }

    function CreateNoStyle2(schemeId) {
        var style = new CStyle("No Style, Table Grid", null, null, styletype_Table);
        style.TablePr.Set_FromObject(
            {
                TableBorders:
                    {
                        Left:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            },

                        Right:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            },

                        Top:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            },

                        Bottom:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            },

                        InsideH:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            },

                        InsideV:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_Single
                            }
                    }
            }
        );
        style.TableWholeTable.Set_FromObject(
            {
                TextPr:
                    {
                        FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                        Unifill: CreateUnifillSolidFillSchemeColor(8, 0)
                    },
                TableCellPr:
                    {
                        Shd:
                            {
                                Unifill: CreateUnifillSolidFillSchemeColor(12, 0)
                            }
                    }
            }
        );
        var styleObject = {
            TableCellPr:
                {
                    Shd:
                        {
                            Unifill: CreateUnifillSolidFillSchemeColor(12, 0)
                        }
                }
        };
        style.TableBand1Horz.Set_FromObject(styleObject);
        style.TableBand1Vert.Set_FromObject(styleObject);

        styleObject = {
            TextPr:
                {
                    Bold: true,
                    FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                    Unifill: CreateUnifillSolidFillSchemeColor(8, 0)
                },
            TableCellPr:
                {
                    Shd:
                        {
                            Unifill: CreateUnifillSolidFillSchemeColor(12, 0)
                        }
                }
        };
        style.TableLastCol.Set_FromObject(styleObject);
        style.TableFirstCol.Set_FromObject(styleObject);

        styleObject.TableCellPr.TableCellBorders =
            {
                Top:
                    {
                        Color: {r: 0, g: 0, b: 0},
                        Unifill: CreateUnifillSolidFillSchemeColor(12, 0),
                        Space: 0,
                        Size: 12700 / 36000,
                        Value: border_Single
                    }
            };
        style.TableLastRow.Set_FromObject(styleObject);
        styleObject.TableCellPr.TableCellBorders =
            {
                Bottom:
                    {
                        Color: {r: 0, g: 0, b: 0},
                        Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                        Space: 0,
                        Size: 12700 / 36000,
                        Value: border_Single
                    }
            };
        styleObject.TextPr =
            {
                Bold: true,
                FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                Unifill: CreateUnifillSolidFillSchemeColor(8, 0)
            };
        style.TableFirstRow.Set_FromObject(styleObject);
        return style;
    }

    function CreateBlackStyle(schemeId) {
        var style = new CStyle("Dark Style 1", null, null, styletype_Table);
        style.TablePr.Set_FromObject(
            {
                TableBorders:
                    {
                        Left:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            },

                        Right:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            },

                        Top:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            },

                        Bottom:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            },

                        InsideH:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            },

                        InsideV:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            }
                    }
            }
        );
        style.TableWholeTable.Set_FromObject(
            {
                TextPr:
                    {
                        FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                        Unifill: CreateUnifillSolidFillSchemeColor(8, 0)
                    },
                TableCellPr:
                    {
                        Shd:
                            {
                                Unifill: CreateUnifillSolidFillSchemeColor(8, 0.2)
                            }
                    }
            }
        );
        var styleObject = {
            TableCellPr:
                {
                    Shd:
                        {
                            Unifill: CreateUnifillSolidFillSchemeColor(8, 0.4)
                        }
                }
        };
        style.TableBand1Horz.Set_FromObject(styleObject);
        style.TableBand1Vert.Set_FromObject(styleObject);

        styleObject = {
            TextPr:
                {
                    Bold: true,
                    FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                    Unifill: CreateUnifillSolidFillSchemeColor(8, 0)
                },
            TableCellPr:
                {
                    Shd:
                        {
                            Unifill: CreateUnifillSolidFillSchemeColor(8, 0)
                        }
                }
        };
        style.TableLastCol.Set_FromObject(styleObject);
        style.TableFirstCol.Set_FromObject(styleObject);

        styleObject.TableCellPr.TableCellBorders =
            {
                Top:
                    {
                        Color: {r: 0, g: 0, b: 0},
                        Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                        Space: 0,
                        Size: 12700 / 36000,
                        Value: border_None
                    }
            };
        style.TableLastRow.Set_FromObject(styleObject);
        styleObject.TableCellPr.TableCellBorders =
            {
                Bottom:
                    {
                        Color: {r: 0, g: 0, b: 0},
                        Unifill: CreateUnifillSolidFillSchemeColor(12, 0),
                        Space: 0,
                        Size: 12700 / 36000,
                        Value: border_Single
                    }
            };
        styleObject.TextPr =
            {
                Bold: true,
                FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                Unifill: CreateUnifillSolidFillSchemeColor(12, 0)
            };
        style.TableFirstRow.Set_FromObject(styleObject);
        return style;
    }

    function CreateDarkStyle2(schemeId) {
        var style = new CStyle("Dark Style 2 - Accent " + (schemeId + 1) + "/" + "Accent " + (schemeId + 2), null, null, styletype_Table);
        style.TablePr.Set_FromObject(
            {
                TableBorders:
                    {
                        Left:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            },

                        Right:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            },

                        Top:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            },

                        Bottom:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            },

                        InsideH:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            },

                        InsideV:
                            {
                                Color: {r: 0, g: 0, b: 0},
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0),
                                Space: 0,
                                Size: 12700 / 36000,
                                Value: border_None
                            }
                    }
            }
        );
        style.TableWholeTable.Set_FromObject(
            {
                TextPr:
                    {
                        FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                        Unifill: CreateUnifillSolidFillSchemeColor(8, 0)
                    },
                TableCellPr:
                    {
                        Shd:
                            {
                                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0.2)
                            }
                    }
            }
        );
        var styleObject = {
            TableCellPr:
                {
                    Shd:
                        {
                            Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0.4)
                        }
                }
        };
        style.TableBand1Horz.Set_FromObject(styleObject);
        style.TableBand1Vert.Set_FromObject(styleObject);

        styleObject = {
            TextPr:
                {
                    Bold: true,
                    FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                    Unifill: CreateUnifillSolidFillSchemeColor(12, 0)
                },
            TableCellPr:
                {
                    Shd:
                        {
                            Unifill: CreateUnifillSolidFillSchemeColor(schemeId + 1, 0)
                        }
                }
        };
        var styleLastObject = {
            TextPr:
                {
                    Bold: true,
                    FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                    Unifill: CreateUnifillSolidFillSchemeColor(8, 0)
                },
            TableCellPr:
                {}
        }
        style.TableLastCol.Set_FromObject(styleLastObject);
        style.TableFirstCol.Set_FromObject(styleLastObject);

        styleLastObject.TableCellPr.Shd =
            {
                Unifill: CreateUnifillSolidFillSchemeColor(schemeId, 0.2)
            }
        styleLastObject.TableCellPr.TableCellBorders =
            {
                Top:
                    {
                        Color: {r: 0, g: 0, b: 0},
                        Unifill: CreateUnifillSolidFillSchemeColor(8, 0),
                        Space: 0,
                        Size: 38100 / 36000,
                        Value: border_Single
                    }
            };

        style.TableLastRow.Set_FromObject(styleLastObject);
        styleObject.TableCellPr.TableCellBorders =
            {
                Bottom:
                    {
                        Color: {r: 0, g: 0, b: 0},
                        Unifill: CreateUnifillSolidFillSchemeColor(12, 0),
                        Space: 0,
                        Size: 12700 / 36000,
                        Value: border_None
                    }
            };
        styleObject.TextPr =
            {
                Bold: true,
                FontRef: AscFormat.CreateFontRef(AscFormat.fntStyleInd_minor, AscFormat.CreatePresetColor("black")),
                Unifill: CreateUnifillSolidFillSchemeColor(12, 0)
            };
        style.TableFirstRow.Set_FromObject(styleObject);
        return style;
    }

    var def, style;

    style = CreateNoStyle1(8);
    Styles.Add(style);
    IdMap[style.Id] = true;

    for (var i = 0; i < 6; ++i) {
        style = CreateThemedStyle1(i);
        Styles.Add(style);
        IdMap[style.Id] = true;
    }
    style = CreateNoStyle2(8);
    Styles.Add(style);
    IdMap[style.Id] = true;

    for (var i = 0; i < 6; ++i) {
        style = CreateThemedStyle2(i);
        Styles.Add(style);
        IdMap[style.Id] = true;
    }

    style = CreateLightStyle1(8);
    Styles.Add(style);
    IdMap[style.Id] = true;

    for (var i = 0; i < 6; ++i) {
        style = CreateLightStyle1(i);
        Styles.Add(style);
        IdMap[style.Id] = true;
    }
    style = CreateLightStyle2(8);
    Styles.Add(style);
    IdMap[style.Id] = true;

    for (var i = 0; i < 6; ++i) {
        style = CreateLightStyle2(i);
        Styles.Add(style);
        IdMap[style.Id] = true;
    }
    style = CreateLightStyle3(8);
    Styles.Add(style);
    IdMap[style.Id] = true;

    for (var i = 0; i < 6; ++i) {
        style = CreateLightStyle3(i);
        Styles.Add(style);
        IdMap[style.Id] = true;
    }

    style = CreateMediumStyle1(8);
    Styles.Add(style);
    IdMap[style.Id] = true;

    for (var i = 0; i < 6; ++i) {
        style = CreateMediumStyle1(i);
        Styles.Add(style);
        IdMap[style.Id] = true;
    }
    style = CreateMediumStyle2(8);
    Styles.Add(style);
    IdMap[style.Id] = true;

    def = CreateMediumStyle2(0);
    Styles.Add(def);
    IdMap[def.Id] = true;

    for (var i = 1; i < 6; ++i) {
        style = CreateMediumStyle2(i);
        Styles.Add(style);
        IdMap[style.Id] = true;
    }
    style = CreateMediumStyle3(8);
    Styles.Add(style);
    IdMap[style.Id] = true;

    for (var i = 0; i < 6; ++i) {
        style = CreateMediumStyle3(i);
        Styles.Add(style);
        IdMap[style.Id] = true;
    }
    style = CreateMediumStyle4(8);
    Styles.Add(style);
    IdMap[style.Id] = true;

    for (var i = 0; i < 6; ++i) {
        style = CreateMediumStyle4(i);
        Styles.Add(style);
        IdMap[style.Id] = true;
    }

    style = CreateBlackStyle(2);
    Styles.Add(style);
    IdMap[style.Id] = true;

    for (var i = 0; i < 6; ++i) {
        style = CreateDarkStyle1(i);
        Styles.Add(style);
        IdMap[style.Id] = true;
    }

    for (var i = 0; i < 3; i++) {
        style = CreateDarkStyle2(2 * i);
        Styles.Add(style);
        IdMap[style.Id] = true;
    }

    return def.Id;
}


function CPrSection() {
    this.name = null;
    this.startIndex = null;
    this.guid = null;
    this.Id = AscCommon.g_oIdCounter.Get_NewId();
    AscCommon.g_oTableId.Add(this, this.Id);
}

CPrSection.prototype.getObjectType = function () {
    return AscDFH.historyitem_type_PresentationSection;
};

CPrSection.prototype.Get_Id = function () {
    return this.Id;
};

CPrSection.prototype.Write_ToBinary2 = function (w) {
    w.WriteLong(this.getObjectType());
    w.WriteString2(this.Get_Id());
};
CPrSection.prototype.Read_FromBinary2 = function (r) {
    this.Id = r.GetString2();
};
CPrSection.prototype.setName = function (pr) {
    History.Add(new AscDFH.CChangesDrawingsString(this, AscDFH.historyitem_PresentationSectionSetName, this.name, pr));
    this.name = pr;
};
CPrSection.prototype.setStartIndex = function (pr) {
    History.Add(new AscDFH.CChangesDrawingsLong(this, AscDFH.historyitem_PresentationSectionSetStartIndex, this.startIndex, pr));
    this.startIndex = pr;
};
CPrSection.prototype.setGuid = function (pr) {
    History.Add(new AscDFH.CChangesDrawingsString(this, AscDFH.historyitem_PresentationSectionSetGuid, this.guid, pr));
    this.guid = pr;
};
CPrSection.prototype.Read_FromBinary2 = function (r) {
    this.Id = r.GetString2();
};

function CShowPr() {
    this.browse = undefined;
    this.kiosk = undefined; //{restart: uInt}
    this.penClr = undefined;
    this.present = false;
    this.show = undefined;// {showAll: true/false, range: {start: uInt, end: uInt}, custShow: uInt};
    this.loop = undefined;
    this.showAnimation = undefined;
    this.showNarration = undefined;
    this.useTimings = undefined;
}

CShowPr.prototype.Write_ToBinary = function (w) {
    var nStartPos = w.GetCurPosition();
    w.Skip(4);
    var Flags = 0;
    if (AscFormat.isRealBool(this.browse)) {
        Flags |= 1;
        w.WriteBool(this.browse);
    }
    if (isRealObject(this.kiosk)) {
        Flags |= 2;
        if (AscFormat.isRealNumber(this.kiosk.restart)) {
            Flags |= 4;
            w.WriteLong(this.kiosk.restart);
        }
    }
    if (isRealObject(this.penClr)) {
        Flags |= 8;
        this.penClr.Write_ToBinary(w);
    }
    w.WriteBool(this.present);
    if (isRealObject(this.show)) {
        Flags |= 16;
        w.WriteBool(this.show.showAll);
        if (!this.show.showAll) {
            if (this.show.range) {
                Flags |= 32;
                w.WriteLong(this.range.start);
                w.WriteLong(this.range.end);
            } else if (AscFormat.isRealNumber(this.show.custShow)) {
                Flags |= 64;
                w.WriteLong(this.show.custShow);
            }
        }
    }
    if (AscFormat.isRealBool(this.loop)) {
        Flags |= 128;
        w.WriteBool(this.loop);
    }
    if (AscFormat.isRealBool(this.showAnimation)) {
        Flags |= 256;
        w.WriteBool(this.showAnimation);
    }
    if (AscFormat.isRealBool(this.showNarration)) {
        Flags |= 512;
        w.WriteBool(this.showNarration);
    }
    if (AscFormat.isRealBool(this.useTimings)) {
        Flags |= 1024;
        w.WriteBool(this.useTimings);
    }
    var nEndPos = w.GetCurPosition();
    w.Seek(nStartPos);
    w.WriteLong(Flags);
    w.Seek(nEndPos);
};

CShowPr.prototype.Read_FromBinary = function (r) {
    var Flags = r.GetLong();
    if (Flags & 1) {
        this.browse = r.GetBool();
    }
    if (Flags & 2) {
        this.kiosk = {};
        if (Flags & 4) {
            this.kiosk.restart = r.GetLong();
        }
    }
    if (Flags & 8) {
        this.penClr = new AscFormat.CUniColor();
        this.penClr.Read_FromBinary(r);
    }
    this.present = r.GetBool();
    if (Flags & 16) {
        this.show = {};
        this.show.showAll = r.GetBool();
        if (Flags & 32) {
            var start = r.GetLong();
            var end = r.GetLong();
            this.show.range = {start: start, end: end};
        } else if (Flags & 64) {
            this.show.custShow = r.GetLong();
        }
    }
    if (Flags & 128) {
        this.loop = r.GetBool();
    }
    if (Flags & 256) {
        this.showAnimation = r.GetBool();
    }
    if (Flags & 512) {
        this.showNarration = r.GetBool();
    }
    if (Flags & 1024) {
        this.useTimings = r.GetBool();
    }
};

CShowPr.prototype.Copy = function () {
    var oCopy = new CShowPr();
    oCopy.browse = this.browse;
    if (isRealObject(this.kiosk)) {
        oCopy.kiosk = {};
        if (AscFormat.isRealBool(this.kiosk.restart)) {
            oCopy.kiosk.restart = this.kiosk.restart;
        }
    }
    if (this.penClr) {
        oCopy.penClr = this.penClr.createDuplicate();
    }
    oCopy.present = this.present;
    if (isRealObject(this.show)) {
        oCopy.show = {};
        oCopy.show.showAll = this.show.showAll;
        if (isRealObject(this.show.range)) {
            oCopy.show.range = {start: this.show.range.start, end: this.show.range.end};
        } else if (AscFormat.isRealNumber(this.show.custShow)) {
            oCopy.show.custShow = this.show.custShow;
        }
    }
    oCopy.loop = this.loop;
    oCopy.showAnimation = this.showAnimation;
    oCopy.showNarration = this.showNarration;
    oCopy.useTimings = this.useTimings;
    return oCopy;
};


AscDFH.changesFactory[AscDFH.historyitem_Presentation_SetShowPr] = AscDFH.CChangesDrawingsObjectNoId;
AscDFH.changesFactory[AscDFH.historyitem_Presentation_AddSlideMaster] = AscDFH.CChangesDrawingsContent;
AscDFH.changesFactory[AscDFH.historyitem_Presentation_ChangeTheme] = AscDFH.CChangesDrawingChangeTheme;
AscDFH.changesFactory[AscDFH.historyitem_Presentation_SlideSize] = AscDFH.CChangesDrawingsObjectNoId;
AscDFH.changesFactory[AscDFH.historyitem_Presentation_ChangeColorScheme] = AscDFH.CChangesDrawingChangeTheme;
AscDFH.changesFactory[AscDFH.historyitem_Presentation_RemoveSlide] = AscDFH.CChangesDrawingsContentPresentation;
AscDFH.changesFactory[AscDFH.historyitem_Presentation_AddSlide] = AscDFH.CChangesDrawingsContentPresentation;
AscDFH.changesFactory[AscDFH.historyitem_Presentation_SetDefaultTextStyle] = AscDFH.CChangesDrawingsObjectNoId;
AscDFH.changesFactory[AscDFH.historyitem_Presentation_SetFirstSlideNum] = AscDFH.CChangesDrawingsLong;
AscDFH.changesFactory[AscDFH.historyitem_Presentation_SetShowSpecialPlsOnTitleSld] = AscDFH.CChangesDrawingsBool;


AscDFH.changesFactory[AscDFH.historyitem_PresentationSectionSetName] = AscDFH.CChangesDrawingsString;
AscDFH.changesFactory[AscDFH.historyitem_PresentationSectionSetStartIndex] = AscDFH.CChangesDrawingsLong;
AscDFH.changesFactory[AscDFH.historyitem_PresentationSectionSetGuid] = AscDFH.CChangesDrawingsString;

AscDFH.drawingsChangesMap[AscDFH.historyitem_PresentationSectionSetName] = function (oClass, value) {
    oClass.name = value;
};
AscDFH.drawingsChangesMap[AscDFH.historyitem_PresentationSectionSetStartIndex] = function (oClass, value) {
    oClass.startIndex = value;
};
AscDFH.drawingsChangesMap[AscDFH.historyitem_PresentationSectionSetGuid] = function (oClass, value) {
    oClass.guid = value;
};

AscDFH.drawingsChangesMap[AscDFH.historyitem_Presentation_SetShowPr] = function (oClass, value) {
    oClass.showPr = value;
};
AscDFH.drawingsChangesMap[AscDFH.historyitem_Presentation_SlideSize] = function (oClass, value) {
    oClass.Width = value.a;
    oClass.Height = value.b;
    oClass.changeSlideSizeFunction(oClass.Width, oClass.Height);
};
AscDFH.drawingsChangesMap[AscDFH.historyitem_Presentation_SetDefaultTextStyle] = function (oClass, value) {
    oClass.defaultTextStyle = value;
};
AscDFH.drawingsChangesMap[AscDFH.historyitem_Presentation_SetFirstSlideNum] = function (oClass, value) {
    oClass.firstSlideNum = value;
};
AscDFH.drawingsChangesMap[AscDFH.historyitem_Presentation_SetShowSpecialPlsOnTitleSld] = function (oClass, value) {
    oClass.showSpecialPlsOnTitleSld = value;
};

AscDFH.drawingContentChanges[AscDFH.historyitem_Presentation_AddSlide] = function (oClass) {
    return oClass.Slides;
};
AscDFH.drawingContentChanges[AscDFH.historyitem_Presentation_RemoveSlide] = function (oClass) {
    return oClass.Slides;
};
AscDFH.drawingContentChanges[AscDFH.historyitem_Presentation_AddSlideMaster] = function (oClass) {
    return oClass.slideMasters;
};

AscDFH.drawingsConstructorsMap[AscDFH.historyitem_Presentation_SetShowPr] = CShowPr;
AscDFH.drawingsConstructorsMap[AscDFH.historyitem_Presentation_SlideSize] = AscFormat.CDrawingBaseCoordsWritable;
AscDFH.drawingsConstructorsMap[AscDFH.historyitem_Presentation_SetDefaultTextStyle] = AscFormat.TextListStyle;


function CPresentation(DrawingDocument) {
  //  CDocumentContentBase.call(this);
    this.History = History;
    this.IdCounter = AscCommon.g_oIdCounter;
    this.TableId = g_oTableId;
    this.CollaborativeEditing = (("undefined" !== typeof (CCollaborativeEditing) && AscCommon.CollaborativeEditing instanceof CCollaborativeEditing) ? AscCommon.CollaborativeEditing : null);
    this.Api = editor;
    this.TurnOffInterfaceEvents = false;
    //------------------------------------------------------------------------
    if (DrawingDocument) {
        if (this.History)
            this.History.Set_LogicDocument(this);

        if (this.CollaborativeEditing)
            this.CollaborativeEditing.m_oLogicDocument = this;
    }

    //------------------------------------------------------------------------

    this.firstSlideNum = null;
    this.showSpecialPlsOnTitleSld = null;

    this.Id = AscCommon.g_oIdCounter.Get_NewId();
    //Props
    this.App = null;
    this.Core = null;

    this.StartPage = 0; // Для совместимости с CDocumentContent
    this.CurPage = 0;

    this.Orientation = Asc.c_oAscPageOrientation.PagePortrait; // ориентация страницы//TODO: remove this

    this.slidesToUnlock = [];


    this.TurnOffRecalc = false;

    this.DrawingDocument = DrawingDocument;

    this.SearchEngine = new CDocumentSearch();

    this.NeedUpdateTarget = false;

    this.noShowContextMenu = false;

    this.viewMode = false;
    // Класс для работы с поиском
    this.SearchInfo =
        {
            Id: null,
            StartPos: 0,
            CurPage: 0,
            String: null
        };

    // Позция каретки
    this.TargetPos =
        {
            X: 0,
            Y: 0,
            PageNum: 0
        };

    this.CopyTextPr = null; // TextPr для копирования по образцу
    this.CopyParaPr = null; // ParaPr для копирования по образцу


    this.Lock = new AscCommon.CLock();

    this.m_oContentChanges = new AscCommon.CContentChanges(); // список изменений(добавление/удаление элементов)


    this.Slides = [];
    this.slideMasters = [];
    this.notesMasters = [];
    this.notes = [];
    this.globalTableStyles = null;
    this.TrackMoveId = null;


    this.Width = 254;
    this.Height = 142;
    this.recalcMap = {};
    this.bNeedUpdateTh = false;
    this.needSelectPages = [];

    this.writecomments = [];

    this.forwardChangeThemeTimeOutId = null;
    this.backChangeThemeTimeOutId = null;
    this.startChangeThemeTimeOutId = null;
    this.TablesForInterface = null;
    this.LastTheme = null;
    this.LastColorScheme = null;
    this.LastColorMap = null;
    this.LastTableLook = null;
    this.DefaultSlideTiming = new CAscSlideTiming();
    this.DefaultSlideTiming.setDefaultParams();

    this.DefaultTableStyleId = null;
    this.TableStylesIdMap = {};
    this.bNeedUpdateChartPreview = false;
    this.LastUpdateTargetTime = 0;
    this.NeedUpdateTargetForCollaboration = false;
    this.oLastCheckContent = null;
    this.CompositeInput = null;


    this.Spelling = new CDocumentSpelling();

    this.Sections = [];//array of CPrSection


    this.comments = new SlideComments(this);

    this.CheckLanguageOnTextAdd = false;

    // Добавляем данный класс в таблицу Id (обязательно в конце конструктора)
    g_oTableId.Add(this, this.Id);
    //
    this.themeLock = new PropLocker(this.Id);
    this.schemeLock = new PropLocker(this.Id);
    this.slideSizeLock = new PropLocker(this.Id);
    this.defaultTextStyleLock = new PropLocker(this.Id);
    this.commentsLock = new PropLocker(this.Id);

    this.RecalcId = 0; // Номер пересчета
    this.CommentAuthors = {};
    this.createDefaultTableStyles();
    this.bGoToPage = false;

    this.custShowList = [];
    this.clrMru = [];
    this.prnPr = null;
    this.showPr = null;

    this.CurPosition =
        {
            X: 0, Y: 0
        };

    this.NotesWidth = -10;
    this.FocusOnNotes = false;

    this.lastMaster = null;
}

//CPresentation.prototype = Object.create(CDocumentContentBase.prototype);
CPresentation.prototype.constructor = CPresentation;


//----------------------------------------------------------------------------------------------------------------------
// Функции для работы с составным вводом
//----------------------------------------------------------------------------------------------------------------------
/**
 * Сообщаем о начале составного ввода текста.
 * @returns {boolean} Начался или нет составной ввод.
 */

CPresentation.prototype.Is_ThisElementCurrent = function () {
    return false;
};

CPresentation.prototype.TurnOffCheckChartSelection = function () {
};

CPresentation.prototype.TurnOnCheckChartSelection = function () {
};

CPresentation.prototype.setFirstSlideNum = function (val) {
    History.Add(new AscDFH.CChangesDrawingsLong(this, AscDFH.historyitem_Presentation_SetFirstSlideNum, this.firstSlideNum, val));
    this.firstSlideNum = val;
};
CPresentation.prototype.setShowSpecialPlsOnTitleSld = function (val) {
    History.Add(new AscDFH.CChangesDrawingsBool(this, AscDFH.historyitem_Presentation_SetShowSpecialPlsOnTitleSld, this.showSpecialPlsOnTitleSld, val));
    this.showSpecialPlsOnTitleSld = val;
};

CPresentation.prototype.setDefaultTextStyle = function (oStyle) {
    History.Add(new AscDFH.CChangesDrawingsObjectNoId(this, AscDFH.historyitem_Presentation_SetDefaultTextStyle, this.defaultTextStyle, oStyle));
    this.defaultTextStyle = oStyle;
};


CPresentation.prototype.addSection = function (pos, pr) {
    History.Add(new AscDFH.CChangesDrawingsContent(this, AscDFH.historyitem_Presentation_AddSection, pos, [pr], true));
    this.Sections.splice(pos, 0, pr);
};

CPresentation.prototype.removeSection = function (pos) {
    History.Add(new AscDFH.CChangesDrawingsContent(this, AscDFH.historyitem_Presentation_AddSection, pos, [], true));
    this.Sections.splice(pos, 0);
};

CPresentation.prototype.Set_DefaultLanguage = function (NewLangId) {
    var oTextStyle = this.defaultTextStyle ? this.defaultTextStyle.createDuplicate() : new AscFormat.TextListStyle();
    if (!oTextStyle.levels[9]) {
        oTextStyle.levels[9] = new CParaPr();
    }
    if (!oTextStyle.levels[9].DefaultRunPr) {
        oTextStyle.levels[9].DefaultRunPr = new CTextPr();
    }
    oTextStyle.levels[9].DefaultRunPr.Lang.Val = NewLangId;
    this.setDefaultTextStyle(oTextStyle);
    this.Restart_CheckSpelling();
    this.Recalculate();
    this.Document_UpdateInterfaceState();
};

CPresentation.prototype.Get_DefaultLanguage = function () {
    var oTextPr = null;
    if (this.defaultTextStyle && this.defaultTextStyle.levels[9]) {
        oTextPr = this.defaultTextStyle.levels[9].DefaultRunPr;
    }
    return oTextPr && oTextPr.Lang.Val ? oTextPr.Lang.Val : 1033;
};

CPresentation.prototype.collectHFProps = function (oSlide) {
    if (oSlide) {
        var oParentObjects = oSlide.getParentObjects();
        var oContent, sText, oField;
        var oSlideHF = new AscCommonSlide.CAscHFProps();
        var sFieldType, oDateTimeFieldsMap;
        oSlideHF.put_Api(this.Api);
        var oDTShape = oSlide.getMatchingShape(AscFormat.phType_dt, null, false, {});

        oSlideHF.put_ShowDateTime(false);
        if (oDTShape) {
            oSlideHF.put_ShowDateTime(true);
        }
        if (!oDTShape) {
            if (oParentObjects.layout) {
                oDTShape = oParentObjects.layout.getMatchingShape(AscFormat.phType_dt, null, false, {});
            }
        }
        if (!oDTShape) {
            if (oParentObjects.master) {
                oDTShape = oParentObjects.master.getMatchingShape(AscFormat.phType_dt, null, false, {});
            }
        }
        if (oDTShape) {
            oContent = oDTShape.getDocContent();
            if (oContent) {
                var oDateTime = new AscCommonSlide.CAscDateTime();
                oContent.Set_ApplyToAll(true);
                sText = oContent.GetSelectedText(false, {NewLine: true, NewParagraph: true});
                oContent.Set_ApplyToAll(false);
                oDateTime.put_CustomDateTime(sText);
                oContent.CalculateAllFields();
                oField = oContent.GetFieldByType2('datetime');
                if (oField) {
                    oDateTimeFieldsMap = {};
                    oDateTimeFieldsMap["datetime"] =
                        oDateTimeFieldsMap["datetime1"] =
                            oDateTimeFieldsMap["datetime2"] =
                                oDateTimeFieldsMap["datetime3"] =
                                    oDateTimeFieldsMap["datetime4"] =
                                        oDateTimeFieldsMap["datetime5"] =
                                            oDateTimeFieldsMap["datetime6"] =
                                                oDateTimeFieldsMap["datetime7"] =
                                                    oDateTimeFieldsMap["datetime8"] =
                                                        oDateTimeFieldsMap["datetime9"] =
                                                            oDateTimeFieldsMap["datetime10"] =
                                                                oDateTimeFieldsMap["datetime11"] =
                                                                    oDateTimeFieldsMap["datetime12"] =
                                                                        oDateTimeFieldsMap["datetime13"] = true;
                    if (oDateTimeFieldsMap[oField.FieldType]) {
                        sFieldType = oField.FieldType;
                    } else {
                        sFieldType = "datetime";
                    }
                    oDateTime.put_DateTime(sFieldType);

                    oDateTime.put_Lang(oField.Pr.Lang.Val);
                }
                oSlideHF.put_DateTime(oDateTime);
            }
        }


        var oSldNumShape = oSlide.getMatchingShape(AscFormat.phType_sldNum, null, false, {});
        if (oSldNumShape) {
            oSlideHF.put_ShowSlideNum(true);
        } else {
            oSlideHF.put_ShowSlideNum(false);
        }

        var oFooterShape = oSlide.getMatchingShape(AscFormat.phType_ftr, null, false, {});
        if (oFooterShape) {
            oSlideHF.put_ShowFooter(true);
        } else {
            oSlideHF.put_ShowFooter(false);
        }
        if (!oFooterShape) {
            if (oParentObjects.layout) {
                oFooterShape = oParentObjects.layout.getMatchingShape(AscFormat.phType_ftr, null, false, {});
            }
        }
        if (!oFooterShape) {
            if (oParentObjects.master) {
                oFooterShape = oParentObjects.master.getMatchingShape(AscFormat.phType_ftr, null, false, {});
            }
        }
        if (oFooterShape) {
            oContent = oFooterShape.getDocContent();
            if (oContent) {
                oContent.Set_ApplyToAll(true);
                sText = oContent.GetSelectedText(false, {NewLine: true, NewParagraph: true});
                oContent.Set_ApplyToAll(false);
                oSlideHF.put_Footer(sText);
            }
        }

        var oHeaderShape = oSlide.getMatchingShape(AscFormat.phType_hdr, null, false, {});
        if (oHeaderShape) {
            oSlideHF.put_ShowHeader(true);
        } else {
            oSlideHF.put_ShowHeader(false);
        }
        if (!oHeaderShape) {
            if (oParentObjects.layout) {
                oHeaderShape = oParentObjects.layout.getMatchingShape(AscFormat.phType_hdr, null, false, {});
            }
        }
        if (!oHeaderShape) {
            if (oParentObjects.master) {
                oHeaderShape = oParentObjects.master.getMatchingShape(AscFormat.phType_hdr, null, false, {});
            }
        }
        if (oHeaderShape) {
            oContent = oHeaderShape.getDocContent();
            if (oContent) {
                oContent.Set_ApplyToAll(true);
                sText = oContent.GetSelectedText(false, {NewLine: true, NewParagraph: true});
                oContent.Set_ApplyToAll(false);
                oSlideHF.put_Footer(sText);
            }
        }
        oSlideHF.put_ShowOnTitleSlide(this.showSpecialPlsOnTitleSld !== false);
        return oSlideHF
    }
    return null;
};

CPresentation.prototype.getHFProperties = function () {
    var oProps = new AscCommonSlide.CAscHF();
    var oSlide = this.Slides[this.CurPage];
    oProps.put_Slide(this.collectHFProps(oSlide));
    if (oProps.Slide) {
        oProps.Slide.slide = oSlide;
    }
    if (oSlide) {
        oProps.put_Notes(this.collectHFProps(oSlide.notes));
        if (oProps.Notes) {
            oProps.Notes.notes = oSlide.notes;
        }
    }
    return oProps;
};


CPresentation.prototype.setHFProperties = function (oProps, bAll) {
    //TODO: check locks
    History.Create_NewPoint(AscDFH.historydescription_Presentation_SetHF);
    var oSlideProps = oProps.get_Slide();
    var i, j, oSlide, oMaster, oParents, oHF, oLayout, oSp,
        sText, oContent, oDateTime, sDateTime, sCustomDateTime, oFld, oParagraph, bRemoveOnTitle, nLang;
    if (oSlideProps) {
        var bShowOnTitleSlide = oSlideProps.get_ShowOnTitleSlide();
        if (bShowOnTitleSlide) {
            if (this.showSpecialPlsOnTitleSld !== null) {
                this.setShowSpecialPlsOnTitleSld(null);
            }
        } else {
            if (this.showSpecialPlsOnTitleSld !== false) {
                this.setShowSpecialPlsOnTitleSld(false);
            }
        }
        if (bAll) {
            var oMastersMap = {};
            for (i = 0; i < this.Slides.length; ++i) {
                oSlide = this.Slides[i];
                oParents = oSlide.getParentObjects();
                oMaster = oParents.master;
                oLayout = oParents.layout;
                bRemoveOnTitle = oLayout.type === AscFormat.nSldLtTTitle && this.showSpecialPlsOnTitleSld === false;
                if (oMaster) {
                    if (!oMaster.hf) {
                        oMaster.setHF(new AscFormat.HF());
                    }
                    oHF = oMaster.hf;
                    if (oSlideProps.get_ShowSlideNum()) {
                        if (oHF.sldNum !== null) {
                            oHF.setSldNum(null);
                        }
                        oSp = oSlide.getMatchingShape(AscFormat.phType_sldNum, null, false, {});
                        if (!bRemoveOnTitle) {
                            if (!oSp) {
                                oSp = oLayout.getMatchingShape(AscFormat.phType_sldNum, null, false, {});
                                if (oSp) {
                                    oSp = oSp.copy(undefined);
                                    oSlide.addToSpTreeToPos(undefined, oSp);
                                    oSp.setParent(oSlide);
                                }
                            }
                        } else {
                            if (oSp) {
                                oSlide.removeFromSpTreeById(oSp.Get_Id());
                                oSp.setBDeleted(true);
                            }
                        }
                    } else {
                        if (oHF.sldNum !== false) {
                            oHF.setSldNum(false);
                        }
                        oSp = oSlide.getMatchingShape(AscFormat.phType_sldNum, null, false, {});
                        if (oSp) {
                            oSlide.removeFromSpTreeById(oSp.Get_Id());
                            oSp.setBDeleted(true);
                        }
                    }

                    if (oSlideProps.get_ShowFooter()) {
                        if (oHF.ftr !== null) {
                            oHF.setFtr(null);
                        }
                        sText = oSlideProps.get_Footer();
                        if (!oMastersMap[oMaster.Get_Id()]) {
                            if (typeof sText === "string") {
                                for (j = 0; j < oMaster.sldLayoutLst.length; ++j) {
                                    oSp = oMaster.sldLayoutLst[j].getMatchingShape(AscFormat.phType_ftr, null, false, {});
                                    oContent = oSp && oSp.getDocContent && oSp.getDocContent();
                                    if (oContent) {
                                        AscFormat.CheckContentTextAndAdd(oContent, sText);
                                    }
                                }
                                oSp = oMaster.getMatchingShape(AscFormat.phType_ftr, null, false, {});
                                oContent = oSp && oSp.getDocContent && oSp.getDocContent();
                                if (oContent) {
                                    AscFormat.CheckContentTextAndAdd(oContent, sText);
                                }
                            }
                        }
                        oSp = oSlide.getMatchingShape(AscFormat.phType_ftr, null, false, {});
                        if (!bRemoveOnTitle) {
                            if (!oSp) {
                                oSp = oLayout.getMatchingShape(AscFormat.phType_ftr, null, false, {});
                                if (oSp) {
                                    oSp = oSp.copy(undefined);
                                    oSlide.addToSpTreeToPos(undefined, oSp);
                                    oSp.setParent(oSlide);
                                }
                            } else {
                                oContent = oSp.getDocContent && oSp.getDocContent();
                                if (oContent && typeof sText === "string") {
                                    AscFormat.CheckContentTextAndAdd(oContent, sText);
                                }
                            }
                        } else {
                            if (oSp) {
                                oSlide.removeFromSpTreeById(oSp.Get_Id());
                                oSp.setBDeleted(true);
                            }
                        }
                    } else {
                        if (oHF.ftr !== false) {
                            oHF.setFtr(false);
                        }
                        oSp = oSlide.getMatchingShape(AscFormat.phType_ftr, null, false, {});
                        if (oSp) {
                            oSlide.removeFromSpTreeById(oSp.Get_Id());
                            oSp.setBDeleted(true);
                        }
                    }

                    if (oSlideProps.get_ShowHeader()) {
                        if (oHF.hdr !== null) {
                            oHF.setHdr(null);
                        }
                        sText = oSlideProps.get_Header();
                        if (!oMastersMap[oMaster.Get_Id()]) {
                            if (typeof sText === "string") {
                                for (j = 0; j < oMaster.sldLayoutLst.length; ++j) {
                                    oSp = oMaster.sldLayoutLst[j].getMatchingShape(AscFormat.phType_hdr, null, false, {});
                                    oContent = oSp && oSp.getDocContent && oSp.getDocContent();
                                    if (oContent) {
                                        AscFormat.CheckContentTextAndAdd(oContent, sText);
                                    }
                                }
                                oSp = oMaster.getMatchingShape(AscFormat.phType_hdr, null, false, {});
                                oContent = oSp && oSp.getDocContent && oSp.getDocContent();
                                if (oContent) {
                                    AscFormat.CheckContentTextAndAdd(oContent, sText);
                                }
                            }
                        }


                        oSp = oSlide.getMatchingShape(AscFormat.phType_hdr, null, false, {});
                        if (!bRemoveOnTitle) {
                            if (!oSp) {
                                oSp = oLayout.getMatchingShape(AscFormat.phType_hdr, null, false, {});
                                if (oSp) {
                                    oSp = oSp.copy(undefined);
                                    oSlide.addToSpTreeToPos(undefined, oSp);
                                    oSp.setParent(oSlide);
                                }
                            } else {
                                oContent = oSp.getDocContent && oSp.getDocContent();
                                if (oContent && typeof sText === "string") {
                                    AscFormat.CheckContentTextAndAdd(oContent, sText);
                                }
                            }
                        } else {
                            if (oSp) {
                                oSlide.removeFromSpTreeById(oSp.Get_Id());
                                oSp.setBDeleted(true);
                            }
                        }
                    } else {
                        if (oHF.hdr !== false) {
                            oHF.setHdr(false);
                        }
                        oSp = oSlide.getMatchingShape(AscFormat.phType_hdr, null, false, {});
                        if (oSp) {
                            oSlide.removeFromSpTreeById(oSp.Get_Id());
                            oSp.setBDeleted(true);
                        }
                    }


                    if (oSlideProps.get_ShowDateTime()) {
                        if (oHF.dt !== null) {
                            oHF.setDt(null);
                        }
                        oDateTime = oSlideProps.get_DateTime();

                        sDateTime = "";
                        sCustomDateTime = "";
                        nLang = 1033;
                        if (oDateTime) {
                            sDateTime = oDateTime.get_DateTime();
                            sCustomDateTime = oDateTime.get_CustomDateTime();
                            nLang = oDateTime.get_Lang();
                            if (!AscFormat.isRealNumber(nLang)) {
                                nLang = 1033;
                            }
                            if (!oMastersMap[oMaster.Get_Id()]) {
                                if (typeof sDateTime === "string" || typeof sCustomDateTime === "string") {
                                    if (sDateTime) {
                                        sCustomDateTime = oDateTime.get_DateTimeExamples()[sDateTime];
                                    }
                                    for (j = 0; j < oMaster.sldLayoutLst.length; ++j) {
                                        oSp = oMaster.sldLayoutLst[j].getMatchingShape(AscFormat.phType_dt, null, false, {});
                                        if (oSp) {
                                            oContent = oSp.getDocContent && oSp.getDocContent();
                                            if (oContent) {
                                                if (sDateTime) {
                                                    oContent.ClearContent(true);
                                                    oParagraph = oContent.Content[0];
                                                    oFld = new AscCommonWord.CPresentationField(oParagraph);
                                                    oFld.SetGuid(AscCommon.CreateGUID());
                                                    oFld.SetFieldType(sDateTime);
                                                    oFld.Set_Lang_Val(nLang);
                                                    if (typeof sCustomDateTime === "string") {
                                                        oFld.CanAddToContent = true;
                                                        oFld.AddText(sCustomDateTime);
                                                        oFld.CanAddToContent = false;
                                                    }
                                                    oParagraph.Internal_Content_Add(0, oFld);
                                                } else {
                                                    AscFormat.CheckContentTextAndAdd(oContent, sCustomDateTime);
                                                }
                                            }
                                        }
                                    }
                                    oSp = oMaster.getMatchingShape(AscFormat.phType_dt, null, false, {});
                                    if (oSp) {
                                        oContent = oSp.getDocContent && oSp.getDocContent();
                                        if (oContent) {
                                            if (sDateTime) {
                                                oContent.ClearContent(true);
                                                oParagraph = oContent.Content[0];
                                                oFld = new AscCommonWord.CPresentationField(oParagraph);
                                                oFld.SetGuid(AscCommon.CreateGUID());
                                                oFld.SetFieldType(sDateTime);
                                                oFld.Set_Lang_Val(nLang);
                                                if (typeof sCustomDateTime === "string") {
                                                    oFld.CanAddToContent = true;
                                                    oFld.AddText(sCustomDateTime);
                                                    oFld.CanAddToContent = false;
                                                }
                                                oParagraph.Internal_Content_Add(0, oFld);
                                            } else {
                                                AscFormat.CheckContentTextAndAdd(oContent, sCustomDateTime);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        oSp = oSlide.getMatchingShape(AscFormat.phType_dt, null, false, {});
                        if (!bRemoveOnTitle) {
                            if (!oSp) {
                                oSp = oLayout.getMatchingShape(AscFormat.phType_dt, null, false, {});
                                if (oSp) {
                                    oSp = oSp.copy(undefined);
                                    oSlide.addToSpTreeToPos(undefined, oSp);
                                    oSp.setParent(oSlide);
                                }
                            } else {
                                oContent = oSp.getDocContent && oSp.getDocContent();
                                if (oContent) {
                                    if (sDateTime) {
                                        oContent.ClearContent(true);
                                        oParagraph = oContent.Content[0];
                                        oFld = new AscCommonWord.CPresentationField(oParagraph);
                                        oFld.SetGuid(AscCommon.CreateGUID());
                                        oFld.SetFieldType(sDateTime);
                                        oFld.Set_Lang_Val(nLang);
                                        if (typeof sCustomDateTime === "string") {
                                            oFld.CanAddToContent = true;
                                            oFld.AddText(sCustomDateTime);
                                            oFld.CanAddToContent = false;
                                        }
                                        oParagraph.Internal_Content_Add(0, oFld);
                                    } else {
                                        AscFormat.CheckContentTextAndAdd(oContent, sCustomDateTime);
                                    }
                                }
                            }
                        } else {
                            if (oSp) {
                                oSlide.removeFromSpTreeById(oSp.Get_Id());
                                oSp.setBDeleted(true);
                            }
                        }
                    } else {
                        if (oHF.dt !== false) {
                            oHF.setDt(false);
                        }
                        oSp = oSlide.getMatchingShape(AscFormat.phType_dt, null, false, {});
                        if (oSp) {
                            oSlide.removeFromSpTreeById(oSp.Get_Id());
                            oSp.setBDeleted(true);
                        }
                    }

                    oMastersMap[oMaster.Get_Id()] = oMaster;
                }
            }
        } else {
            var aSelectedSlides = this.GetSelectedSlides();
            for (var nSlideIndex = 0; nSlideIndex < aSelectedSlides.length; ++nSlideIndex) {
                oSlide = this.Slides[aSelectedSlides[nSlideIndex]];
                if (oSlide) {
                    oParents = oSlide.getParentObjects();
                    oLayout = oParents.layout;
                    bRemoveOnTitle = oLayout.type === AscFormat.nSldLtTTitle && this.showSpecialPlsOnTitleSld === false;
                    if (oSlideProps.get_ShowSlideNum() && !bRemoveOnTitle) {
                        if (!oSlide.getMatchingShape(AscFormat.phType_sldNum, null, false, {})) {
                            oSp = oLayout.getMatchingShape(AscFormat.phType_sldNum, null, false, {});
                            if (oSp) {
                                oSp = oSp.copy(undefined);
                                oSlide.addToSpTreeToPos(undefined, oSp);
                                oSp.setParent(oSlide);
                            }
                        }
                    } else {
                        oSp = oSlide.getMatchingShape(AscFormat.phType_sldNum, null, false, {});
                        if (oSp) {
                            oSlide.removeFromSpTreeById(oSp.Get_Id());
                            oSp.setBDeleted(true);
                        }
                    }

                    if (oSlideProps.get_ShowFooter() && !bRemoveOnTitle) {
                        sText = oSlideProps.get_Footer();
                        oSp = oSlide.getMatchingShape(AscFormat.phType_ftr, null, false, {});
                        if (!oSp) {
                            oSp = oLayout.getMatchingShape(AscFormat.phType_ftr, null, false, {});
                            if (oSp) {
                                oSp = oSp.copy(undefined);
                                oSlide.addToSpTreeToPos(undefined, oSp);
                                oSp.setParent(oSlide);
                            }
                        }
                        if (oSp) {
                            oContent = oSp.getDocContent && oSp.getDocContent();
                            if (oContent && typeof sText === "string") {
                                AscFormat.CheckContentTextAndAdd(oContent, sText);
                            }
                        }
                    } else {
                        oSp = oSlide.getMatchingShape(AscFormat.phType_ftr, null, false, {});
                        if (oSp) {
                            oSlide.removeFromSpTreeById(oSp.Get_Id());
                            oSp.setBDeleted(true);
                        }
                    }

                    if (oSlideProps.get_ShowHeader() && !bRemoveOnTitle) {
                        sText = oSlideProps.get_Header();
                        oSp = oSlide.getMatchingShape(AscFormat.phType_hdr, null, false, {});
                        if (!oSp) {
                            oSp = oLayout.getMatchingShape(AscFormat.phType_hdr, null, false, {});
                            if (oSp) {
                                oSp = oSp.copy(undefined);
                                oSlide.addToSpTreeToPos(undefined, oSp);
                                oSp.setParent(oSlide);
                            }
                        }
                        if (oSp) {
                            oContent = oSp.getDocContent && oSp.getDocContent();
                            if (oContent && typeof sText === "string") {
                                AscFormat.CheckContentTextAndAdd(oContent, sText);
                            }
                        }
                    } else {
                        oSp = oSlide.getMatchingShape(AscFormat.phType_hdr, null, false, {});
                        if (oSp) {
                            oSlide.removeFromSpTreeById(oSp.Get_Id());
                            oSp.setBDeleted(true);
                        }
                    }

                    if (oSlideProps.get_ShowDateTime() && !bRemoveOnTitle) {
                        oDateTime = oSlideProps.get_DateTime();
                        sDateTime = "";
                        sCustomDateTime = "";
                        nLang = 1033;
                        if (oDateTime) {
                            sDateTime = oDateTime.get_DateTime();
                            sCustomDateTime = oDateTime.get_CustomDateTime();
                            if (sDateTime) {
                                sCustomDateTime = oDateTime.get_DateTimeExamples()[sDateTime];
                            }
                            nLang = oDateTime.get_Lang();
                            if (!AscFormat.isRealNumber(nLang)) {
                                nLang = 1033;
                            }
                        }
                        oSp = oSlide.getMatchingShape(AscFormat.phType_dt, null, false, {});
                        if (!oSp) {
                            oSp = oLayout.getMatchingShape(AscFormat.phType_dt, null, false, {});
                            if (oSp) {
                                oSp = oSp.copy(undefined);
                                oSlide.addToSpTreeToPos(undefined, oSp);
                                oSp.setParent(oSlide);
                            }
                        } 
                        if(oSp) {
                            oContent = oSp.getDocContent && oSp.getDocContent();
                            if (oContent) {
                                if (sDateTime) {
                                    oContent.ClearContent(true);
                                    oParagraph = oContent.Content[0];
                                    oFld = new AscCommonWord.CPresentationField(oParagraph);
                                    oFld.SetGuid(AscCommon.CreateGUID());
                                    oFld.SetFieldType(sDateTime);
                                    oFld.Set_Lang_Val(nLang);
                                    if (typeof sCustomDateTime === "string") {
                                        oFld.CanAddToContent = true;
                                        oFld.AddText(sCustomDateTime);
                                        oFld.CanAddToContent = false;
                                    }
                                    oParagraph.Internal_Content_Add(0, oFld);
                                } else {
                                    AscFormat.CheckContentTextAndAdd(oContent, sCustomDateTime);
                                }
                            }
                        }
                    } else {
                        oSp = oSlide.getMatchingShape(AscFormat.phType_dt, null, false, {});
                        if (oSp) {
                            oSlide.removeFromSpTreeById(oSp.Get_Id());
                            oSp.setBDeleted(true);
                        }
                    }
                }
            }
        }
        this.Recalculate();
        this.Document_UpdateSelectionState();
        this.Document_UpdateUndoRedoState();
        this.Document_UpdateInterfaceState();
        this.Document_UpdateRulersState();
    }
};


CPresentation.prototype.addFieldToContent = function (fCallback) {
    var oController = this.GetCurrentController();
    if (!oController) {
        return;
    }
    var oContent = oController.getTargetDocContent(undefined, false);
    if (!oContent) {
        return;
    }
    if (false === this.Document_Is_SelectionLocked(changestype_Drawing_Props)) {
        this.StartAction(AscDFH.historydescription_Presentation_AddSlideNumber);
        oContent = oController.getTargetDocContent(true, false);
        if (oContent) {
            if (true === oContent.IsSelectionUse())
                oContent.Remove(1, true, false, true);
            var oParagraph = oContent.Content[oContent.CurPos.ContentPos];
            if (oParagraph) {
                var oFld = fCallback.call(this, oParagraph);
                if (oFld) {
                    oContent.AddToParagraph(oFld, false, false);
                    oContent.MoveCursorRight(false, false);
                    this.Recalculate();
                    this.RecalculateCurPos();
                    this.Document_UpdateSelectionState();
                }
            }
        }
        this.FinalizeAction(true);
    }
};

CPresentation.prototype.addSlideNumber = function () {
    this.addFieldToContent(function (oParagraph) {
        var oFld = new AscCommonWord.CPresentationField(oParagraph);
        oFld.SetGuid(AscCommon.CreateGUID());
        oFld.SetFieldType("slidenum");
        var nFirstSlideNum = AscFormat.isRealNumber(this.firstSlideNum) ? this.firstSlideNum : 1;
        oFld.AddText("" + (this.CurPage + nFirstSlideNum));
        return oFld;
    });
};

CPresentation.prototype.addDateTime = function (oPr) {
    this.addFieldToContent(function (oParagraph) {
        var oFld = null;
        if (oPr) {
            var sCustomDateTime = oPr.get_CustomDateTime();
            var sFieldType = oPr.get_DateTime();
            var nLang = oPr.get_Lang();
            if (!AscFormat.isRealNumber(nLang)) {
                nLang = 1033;
            }
            if (typeof sFieldType === "string" && sFieldType.length > 0) {
                oFld = new AscCommonWord.CPresentationField(oParagraph);
                oFld.SetGuid(AscCommon.CreateGUID());
                oFld.SetFieldType(sFieldType);
                if (sFieldType) {
                    sCustomDateTime = oPr.get_DateTimeExamples()[sFieldType];
                }
                oFld.Set_Lang_Val(nLang);
                if (typeof sCustomDateTime === "string" && sCustomDateTime.length > 0) {
                    oFld.CanAddToContent = true;
                    oFld.AddText(sCustomDateTime);
                    oFld.CanAddToContent = false;
                }
            } else {
                if (typeof sCustomDateTime === "string" && sCustomDateTime.length > 0) {
                    oFld = new AscCommonWord.ParaRun(oParagraph);
                    oFld.AddText(sCustomDateTime);
                    oFld.Set_Lang_Val(nLang);
                }
            }
        }
        return oFld;
    });
};

CPresentation.prototype.Restart_CheckSpelling = function () {
    this.Spelling.Reset();
    for (var i = 0; i < this.Slides.length; ++i) {
        this.Slides[i].Restart_CheckSpelling();
    }
};

CPresentation.prototype.GetSelectionBounds = function () {
    var oController = this.GetCurrentController();
    if (oController) {
        var oTargetDocContent = oController.getTargetDocContent();
        if (oTargetDocContent) {
            return oTargetDocContent.GetSelectionBounds();
        }
    }
    return null;
};


CPresentation.prototype.GetTextTransformMatrix = function () {
    var oController = this.GetCurrentController();
    if (oController) {
        var oTargetDocContent = oController.getTargetDocContent();
        if (oTargetDocContent) {
            return oTargetDocContent.Get_ParentTextTransform();
        }
    }
    return null;
};


CPresentation.prototype.IsViewMode = function () {
    return this.Api.getViewMode();
};


CPresentation.prototype.IsEditCommentsMode = function () {
    return this.Api.isRestrictionComments();
};

CPresentation.prototype.IsEditSignaturesMode = function () {
    return this.Api.isRestrictionSignatures();
};
CPresentation.prototype.IsViewModeInEditor = function () {
    return this.Api.isRestrictionView();
};

CPresentation.prototype.CanEdit = function () {
    return this.Api.canEdit();
};


CPresentation.prototype.Stop_CheckSpelling = function () {
    this.Spelling.Reset();
};

CPresentation.prototype.ContinueCheckSpelling = function () {
    this.Spelling.ContinueCheckSpelling();
};

CPresentation.prototype.TurnOff_CheckSpelling = function () {
    this.Spelling.TurnOff();
};

CPresentation.prototype.TurnOn_CheckSpelling = function () {
    this.Spelling.TurnOn();
};


CPresentation.prototype.Get_DrawingDocument = function () {
    return this.DrawingDocument;
};

CPresentation.prototype.GetCurrentController = function () {
    var oCurSlide = this.Slides[this.CurPage];
    if (oCurSlide) {
        if (this.FocusOnNotes) {
            return oCurSlide.notes && oCurSlide.notes.graphicObjects;
        } else {
            return oCurSlide.graphicObjects;
        }
    }
    return null;
};

CPresentation.prototype.Get_TargetDocContent = function () {
    var oController = this.GetCurrentController();
    if (oController) {
        return oController.getTargetDocContent(true);
    }
    return null;
};

CPresentation.prototype.Begin_CompositeInput = function () {
    var oCurSlide = this.Slides[this.CurPage];
    if (!this.FocusOnNotes && oCurSlide && oCurSlide.graphicObjects.selectedObjects.length === 0) {
        var oTitle = oCurSlide.getMatchingShape(AscFormat.phType_title, null);
        if (oTitle) {
            var oDocContent = oTitle.getDocContent();
            if (oDocContent.Is_Empty()) {
                oDocContent.Set_CurrentElement(0, false);
            } else {
                return;
            }
        } else {
            return;
        }
    }
    if (false === this.Document_Is_SelectionLocked(changestype_Drawing_Props, null, true)) {
        this.Create_NewHistoryPoint(AscDFH.historydescription_Document_CompositeInput);
        var oController = this.GetCurrentController();
        if (oController) {
            oController.CreateDocContent();
        }


        var oContent = this.Get_TargetDocContent();
        if (!oContent) {
            this.History.Remove_LastPoint();
            return false;
        }
        this.DrawingDocument.TargetStart();
        this.DrawingDocument.TargetShow();
        var oPara = oContent.GetCurrentParagraph();
        if (!oPara) {
            this.History.Remove_LastPoint();
            return false;
        }
        if (true === oContent.IsSelectionUse())
            oContent.Remove(1, true, false, true);
        var oRun = oPara.Get_ElementByPos(oPara.Get_ParaContentPos(false, false));
        if (!oRun || !(oRun instanceof ParaRun)) {
            this.History.Remove_LastPoint();
            return false;
        }

        this.CompositeInput = {
            Run: oRun,
            Pos: oRun.State.ContentPos,
            Length: 0
        };

        oRun.Set_CompositeInput(this.CompositeInput);

        return true;
    }

    return false;
};

CPresentation.prototype.IsFillingFormMode = function () {
    return false;
};

CPresentation.prototype.Reset_WordSelection = function () {
    this.WordSelected = false;
};

CPresentation.prototype.Set_WordSelection = function () {
    this.WordSelected = true;
};

CPresentation.prototype.Is_WordSelection = function () {
    return this.WordSelected;
};


CPresentation.prototype.checkCurrentTextObjectExtends = function () {
    var oController = this.GetCurrentController();
    if (oController) {
        var oTargetTextObject = AscFormat.getTargetTextObject(oController);
        if (oTargetTextObject && oTargetTextObject.checkExtentsByDocContent) {
            oTargetTextObject.checkExtentsByDocContent(true, true);
        }
    }
};

CPresentation.prototype.addCompositeText = function (nCharCode) {
    // TODO: При таком вводе не меняется язык в зависимости от раскладки, не учитывается режим рецензирования.

    if (null === this.CompositeInput)
        return;

    var oRun = this.CompositeInput.Run;
    var nPos = this.CompositeInput.Pos + this.CompositeInput.Length;
    var oChar;
    if (para_Math_Run === oRun.Type) {
        oChar = new CMathText();
        oChar.add(nCharCode);
    } else {
        if (32 == nCharCode || 12288 == nCharCode)
            oChar = new ParaSpace();
        else
            oChar = new ParaText(nCharCode);
    }
    oRun.AddToContent(nPos, oChar, true);
    this.CompositeInput.Length++;
};
CPresentation.prototype.Add_CompositeText = function (nCharCode) {
    if (null === this.CompositeInput)
        return;
    this.Create_NewHistoryPoint(AscDFH.historydescription_Document_CompositeInputReplace);
    this.addCompositeText(nCharCode);
    this.checkCurrentTextObjectExtends();
    this.Recalculate();
    this.Document_UpdateSelectionState();
};

CPresentation.prototype.removeCompositeText = function (nCount) {
    if (null === this.CompositeInput)
        return;

    var oRun = this.CompositeInput.Run;
    var nPos = this.CompositeInput.Pos + this.CompositeInput.Length;

    var nDelCount = Math.max(0, Math.min(nCount, this.CompositeInput.Length, oRun.Content.length, nPos));
    oRun.Remove_FromContent(nPos - nDelCount, nDelCount, true);
    this.CompositeInput.Length -= nDelCount;
};

CPresentation.prototype.Remove_CompositeText = function (nCount) {
    this.removeCompositeText(nCount);
    this.checkCurrentTextObjectExtends();
    this.Recalculate();
    this.Document_UpdateSelectionState();
};
CPresentation.prototype.Replace_CompositeText = function (arrCharCodes) {
    if (null === this.CompositeInput)
        return;
    this.Create_NewHistoryPoint(AscDFH.historydescription_Document_CompositeInputReplace);
    this.removeCompositeText(this.CompositeInput.Length);
    for (var nIndex = 0, nCount = arrCharCodes.length; nIndex < nCount; ++nIndex) {
        this.addCompositeText(arrCharCodes[nIndex]);
    }
    this.checkCurrentTextObjectExtends();
    this.Recalculate();
    this.Document_UpdateSelectionState();
};
CPresentation.prototype.Set_CursorPosInCompositeText = function (nPos) {
    if (null === this.CompositeInput)
        return;

    var oRun = this.CompositeInput.Run;

    var nInRunPos = Math.max(Math.min(this.CompositeInput.Pos + nPos, this.CompositeInput.Pos + this.CompositeInput.Length, oRun.Content.length), this.CompositeInput.Pos);
    oRun.State.ContentPos = nInRunPos;
    this.Document_UpdateSelectionState();
};
CPresentation.prototype.Get_CursorPosInCompositeText = function () {
    if (null === this.CompositeInput)
        return 0;

    var oRun = this.CompositeInput.Run;
    var nInRunPos = oRun.State.ContentPos;
    var nPos = Math.min(this.CompositeInput.Length, Math.max(0, nInRunPos - this.CompositeInput.Pos));
    return nPos;
};
CPresentation.prototype.End_CompositeInput = function () {
    if (null === this.CompositeInput)
        return;

    var oRun = this.CompositeInput.Run;
    oRun.Set_CompositeInput(null);
    this.CompositeInput = null;

    var oController = this.GetCurrentController();
    if (oController) {
        var oTargetTextObject = AscFormat.getTargetTextObject(oController);
        if (oTargetTextObject && oTargetTextObject.txWarpStructNoTransform) {
            oTargetTextObject.recalculateContent();
        }
    }
    this.Document_UpdateInterfaceState();

    this.DrawingDocument.ClearCachePages();
    this.DrawingDocument.FirePaint();
};
CPresentation.prototype.Get_MaxCursorPosInCompositeText = function () {
    if (null === this.CompositeInput)
        return 0;

    return this.CompositeInput.Length;
};


CPresentation.prototype.setShowLoop = function (value) {
    if (value === false) {
        if (!this.showPr) {
            return;
        } else {
            if (this.showPr.loop !== false) {
                var oCopyShowPr = this.showPr.Copy();
                oCopyShowPr.loop = false;
                this.setShowPr(oCopyShowPr);
            }
        }
    } else {
        if (!this.showPr) {
            var oShowPr = new CShowPr();
            oShowPr.loop = true;
            this.setShowPr(oShowPr);
        } else {
            if (!this.showPr.loop) {
                var oCopyShowPr = this.showPr.Copy();
                oCopyShowPr.loop = true;
                this.setShowPr(oCopyShowPr);
            }
        }
    }
};

CPresentation.prototype.isLoopShowMode = function () {
    if (this.showPr) {
        return this.showPr.loop === true;
    }
    return false;
};


CPresentation.prototype.setShowPr = function (oShowPr) {
    History.Add(new AscDFH.CChangesDrawingsObjectNoId(this, AscDFH.historyitem_Presentation_SetShowPr, this.showPr, oShowPr));
    this.showPr = oShowPr;
};

CPresentation.prototype.createDefaultTableStyles = function () {
    //AscFormat.ExecuteNoHistory(function(){
    this.globalTableStyles = new CStyles(false);
    this.DefaultTableStyleId = CreatePresentationTableStyles(this.globalTableStyles, this.TableStylesIdMap);
    //}, this, []);
};
// Проводим начальные действия, исходя из Документа
CPresentation.prototype.Init = function () {

};

CPresentation.prototype.Get_Api = function () {
    return this.Api;
};

CPresentation.prototype.Get_CollaborativeEditing = function () {
    return this.CollaborativeEditing;
};

CPresentation.prototype.addSlideMaster = function (pos, master) {
    History.Add(new AscDFH.CChangesDrawingsContent(this, AscDFH.historyitem_Presentation_AddSlideMaster, pos, [master], true));
    this.slideMasters.splice(pos, 0, master);
};

CPresentation.prototype.Get_Id = function () {
    return this.Id;
};

CPresentation.prototype.LoadEmptyDocument = function () {
    this.DrawingDocument.TargetStart();
    this.Recalculate();

    this.Interface_Update_ParaPr();
    this.Interface_Update_TextPr();
};

CPresentation.prototype.EndPreview_MailMergeResult = function () {
};

CPresentation.prototype.CheckNeedUpdateTargetForCollaboration = function () {
    if (!this.NeedUpdateTargetForCollaboration) {
        var oController = this.GetCurrentController();
        if (oController) {
            var oTargetDocContent = oController.getTargetDocContent();
            if (oTargetDocContent !== this.oLastCheckContent) {
                this.oLastCheckContent = oTargetDocContent;
                return true;
            }
        }
        return false;
    }
    return true;
};


CPresentation.prototype.Is_OnRecalculate = function () {
    return true;
};
CPresentation.prototype.Continue_FastCollaborativeEditing = function () {
    if (true === AscCommon.CollaborativeEditing.Get_GlobalLock()) {
        if (this.Api.forceSaveUndoRequest)
            this.Api.asc_Save(true);

        return;
    }

    if (this.Api.isLongAction())
        return;
    if (true !== AscCommon.CollaborativeEditing.Is_Fast() || true === AscCommon.CollaborativeEditing.Is_SingleUser())
        return;

    var oController = this.GetCurrentController();
    if (oController) {
        if (oController.checkTrackDrawings() || this.Api.isOpenedChartFrame) {
            return;
        }
    }

    var bHaveChanges = History.Have_Changes(true);
    if (true !== bHaveChanges && (true === AscCommon.CollaborativeEditing.Have_OtherChanges() || 0 !== AscCommon.CollaborativeEditing.getOwnLocksLength())) {
        // Принимаем чужие изменение. Своих нет, но функцию отсылки надо вызвать, чтобы снялить локи.
        AscCommon.CollaborativeEditing.Apply_Changes();
        AscCommon.CollaborativeEditing.Send_Changes();
    } else if (true === bHaveChanges || true === AscCommon.CollaborativeEditing.Have_OtherChanges()) {
        editor.asc_Save(true);
    }

    var CurTime = new Date().getTime();
    if (this.CheckNeedUpdateTargetForCollaboration() && (CurTime - this.LastUpdateTargetTime > 1000)) {
        this.NeedUpdateTargetForCollaboration = false;
        if (true !== bHaveChanges) {
            var CursorInfo = History.Get_DocumentPositionBinary();
            if (null !== CursorInfo) {
                editor.CoAuthoringApi.sendCursor(CursorInfo);
                this.LastUpdateTargetTime = CurTime;
            }
        } else {
            this.LastUpdateTargetTime = CurTime;
        }
    }
};

CPresentation.prototype.Get_DocumentPositionInfoForCollaborative = function () {
    var oController = this.GetCurrentController();
    if (oController) {
        var oTargetDocContent = oController.getTargetDocContent(undefined, true);
        if (oTargetDocContent) {
            var DocPos = oTargetDocContent.GetContentPosition(oTargetDocContent.IsSelectionUse(), false);
            if (!DocPos || DocPos.length <= 0)
                return null;

            var Last = DocPos[DocPos.length - 1];
            if (!(Last.Class instanceof ParaRun))
                return {Class: this, Position: 0};

            return Last;
        }
    }
    return {Class: this, Position: 0};
};

CPresentation.prototype.GetRecalculateMaps = function () {
    var ret = {
        layouts: {},
        masters: {}
    };

    for (var i = 0; i < this.Slides.length; ++i) {
        if (this.Slides[i].Layout) {
            ret.layouts[this.Slides[i].Layout.Id] = this.Slides[i].Layout;
            if (this.Slides[i].Layout.Master) {
                ret.masters[this.Slides[i].Layout.Master.Id] = this.Slides[i].Layout.Master;
            }
        }
    }
    return ret;
};

CPresentation.prototype.replaceMisspelledWord = function (Word, SpellCheckProperty) {
    var ParaId = SpellCheckProperty.ParaId;
    var Paragraph = g_oTableId.Get_ById(ParaId);
    Paragraph.Document_SetThisElementCurrent(true);
    var oController = this.GetCurrentController();
    if (oController) {
        oController.checkSelectedObjectsAndCallback(function () {
            Paragraph.ReplaceMisspelledWord(Word, SpellCheckProperty.Element);
        }, [], false, AscDFH.historydescription_Document_ReplaceMisspelledWord);
    }
};


CPresentation.prototype.Recalculate = function (RecalcData) {
    this.DrawingDocument.OnStartRecalculate(this.Slides.length);
    ++this.RecalcId;
    if (undefined === RecalcData) {
        // Проверяем можно ли сделать быстрый пересчет
        var SimpleChanges = History.Is_SimpleChanges();
        if (1 === SimpleChanges.length) {
            var Run = SimpleChanges[0].Class;
            var Para = Run.Paragraph;
            var Res = Para.Recalculate_FastRange(SimpleChanges);
            if (-1 !== Res) {
                var oCurSlide = this.Slides[this.CurPage];
                if (oCurSlide) {
                    if (!this.FocusOnNotes) {
                        this.DrawingDocument.OnRecalculatePage(this.CurPage, oCurSlide);
                        this.DrawingDocument.OnEndRecalculate();
                    } else {
                        this.DrawingDocument.Notes_OnRecalculate(this.CurPage, oCurSlide.NotesWidth, oCurSlide.getNotesHeight());
                    }

                }
                History.Get_RecalcData();
                History.Reset_RecalcIndex();
                var DrawingShape = Para.Parent.Is_DrawingShape(true);
                if (DrawingShape && DrawingShape.recalcInfo && DrawingShape.recalcInfo.recalcTitle) {
                    DrawingShape.recalcInfo.bRecalculatedTitle = true;
                    DrawingShape.recalcInfo.recalcTitle = null;
                }
                return;
            }
        }
    }
    if (this.SearchEngine.ClearOnRecalc) {
        this.SearchEngine.Clear();
        this.SearchEngine.ClearOnRecalc = false;
    }
    var _RecalcData = RecalcData ? RecalcData : History.Get_RecalcData(), key, recalcMap, bSync = true, i,
        bRedrawAllSlides = false, aToRedrawSlides = [], redrawSlideIndexMap = {}, slideIndex;
    var bAttack = undefined;
    this.updateSlideIndexes();
    var b_check_layout = false;
    var bRedrawNotes = false;
    if (_RecalcData.Drawings.All || _RecalcData.Drawings.ThemeInfo) {
        b_check_layout = true;
        recalcMap = this.GetRecalculateMaps();
        for (key in recalcMap.masters) {
            if (recalcMap.masters.hasOwnProperty(key)) {
                recalcMap.masters[key].recalculate();
            }
        }
        for (key in recalcMap.layouts) {
            if (recalcMap.layouts.hasOwnProperty(key)) {
                recalcMap.layouts[key].recalculate();
            }
        }
        this.bNeedUpdateChartPreview = true;
        if (_RecalcData.Drawings.ThemeInfo) {
            this.clearThemeTimeouts();

            if (_RecalcData.Drawings && _RecalcData.Drawings.Map) {
                for (key in _RecalcData.Drawings.Map) {
                    if (_RecalcData.Drawings.Map.hasOwnProperty(key)) {
                        var oSlide = _RecalcData.Drawings.Map[key];
                        if (oSlide instanceof AscCommonSlide.Slide && AscFormat.isRealNumber(oSlide.num)) {
                            var ArrInd = _RecalcData.Drawings.ThemeInfo.ArrInd;
                            for (i = 0; i < ArrInd.length; ++i) {
                                if (oSlide.num === ArrInd[i]) {
                                    break;
                                }
                            }
                            if (i === ArrInd.length) {
                                _RecalcData.Drawings.ThemeInfo.ArrInd.push(oSlide.num);
                            }
                        }
                    }
                }
            }
            var startRecalcIndex = _RecalcData.Drawings.ThemeInfo.ArrInd.indexOf(this.CurPage);
            if (startRecalcIndex === -1) {
                startRecalcIndex = 0;
            }
            var oThis = this;
            bSync = false;
            aToRedrawSlides = [].concat(_RecalcData.Drawings.ThemeInfo.ArrInd);
            AscFormat.redrawSlide(oThis.Slides[_RecalcData.Drawings.ThemeInfo.ArrInd[startRecalcIndex]], oThis, aToRedrawSlides, startRecalcIndex, 0, oThis.Slides);
        } else {
            bRedrawAllSlides = true;
            for (key = 0; key < this.Slides.length; ++key) {
                this.Slides[key].recalcText();
                this.Slides[key].recalculate();
                this.Slides[key].recalculateNotesShape();
            }
        }
    } else {
        var oCurNotesShape = null;
        if (this.Slides[this.CurPage]) {
            oCurNotesShape = this.Slides[this.CurPage].notesShape;
        }
        for (key in _RecalcData.Drawings.Map) {
            if (_RecalcData.Drawings.Map.hasOwnProperty(key)) {
                var oDrawingObject = _RecalcData.Drawings.Map[key];
                oDrawingObject.recalculate();
                if (oDrawingObject.parent instanceof AscCommonSlide.SlideLayout) {
                    oDrawingObject.parent.ImageBase64 = "";
                    b_check_layout = true;
                    bAttack = true;
                    for (i = 0; i < this.Slides.length; ++i) {
                        if (this.Slides[i].Layout === oDrawingObject.parent) {
                            if (redrawSlideIndexMap[i] !== true) {
                                redrawSlideIndexMap[i] = true;
                                aToRedrawSlides.push(i);
                            }
                        }
                    }
                }
                if (oDrawingObject instanceof AscCommonSlide.SlideLayout) {
                    oDrawingObject.ImageBase64 = "";
                    b_check_layout = true;
                    bAttack = true;
                    for (i = 0; i < this.Slides.length; ++i) {
                        if (this.Slides[i].Layout === oDrawingObject) {
                            if (redrawSlideIndexMap[i] !== true) {
                                redrawSlideIndexMap[i] = true;
                                aToRedrawSlides.push(i);
                            }
                        }
                    }
                }
                if (oDrawingObject.getSlideIndex) {
                    slideIndex = oDrawingObject.getSlideIndex();
                    if (slideIndex !== null) {
                        if (redrawSlideIndexMap[slideIndex] !== true) {
                            redrawSlideIndexMap[slideIndex] = true;
                            aToRedrawSlides.push(slideIndex);
                        }
                    } else {
                        if (oCurNotesShape && oCurNotesShape === oDrawingObject) {
                            this.Slides[this.CurPage].recalculateNotesShape();
                            bRedrawNotes = true;
                        }
                    }
                }
            }
        }
    }
    History.Reset_RecalcIndex();
    this.RecalculateCurPos();
    if (bSync) {
        var bEndRecalc = false;
        if (bRedrawAllSlides) {
            for (i = 0; i < this.Slides.length; ++i) {
                this.DrawingDocument.OnRecalculatePage(i, this.Slides[i]);
            }
            bEndRecalc = (this.Slides.length > 0);
            if (this.Slides[this.CurPage]) {
                this.DrawingDocument.Notes_OnRecalculate(this.CurPage, this.Slides[this.CurPage].NotesWidth, this.Slides[this.CurPage].getNotesHeight());
            }

        } else {
            aToRedrawSlides.sort(AscCommon.fSortAscending);
            for (i = 0; i < aToRedrawSlides.length; ++i) {
                this.DrawingDocument.OnRecalculatePage(aToRedrawSlides[i], this.Slides[aToRedrawSlides[i]]);
            }
            bEndRecalc = (aToRedrawSlides.length > 0);
        }
        if (bRedrawNotes) {
            if (this.Slides[this.CurPage]) {
                this.DrawingDocument.Notes_OnRecalculate(this.CurPage, this.Slides[this.CurPage].NotesWidth, this.Slides[this.CurPage].getNotesHeight());
            }
        }
        if (bEndRecalc || this.Slides.length === 0) {
            this.DrawingDocument.OnEndRecalculate();
        }
    }
    if (!this.Slides[this.CurPage]) {
        this.DrawingDocument.m_oWordControl.GoToPage(this.Slides.length - 1);

        //this.Set_CurPage(this.Slides.length - 1);
    } else {
        if (this.bGoToPage) {
            this.DrawingDocument.m_oWordControl.GoToPage(this.CurPage);
            this.bGoToPage = false;
        } else if (b_check_layout) {
            this.DrawingDocument.m_oWordControl.CheckLayouts(bAttack);
        }
        if (this.needSelectPages.length > 0) {
            //for(slideIndex = 0; i < this.needSelectPages.length; ++i)
            //{
            //    this.DrawingDocument.SelectPage(this.needSelectPages[slideIndex]);
            //}
            this.needSelectPages.length = 0;
        }
        if (this.bNeedUpdateTh) {
            this.DrawingDocument.UpdateThumbnailsAttack();
            this.bNeedUpdateTh = false;
        }
    }
    this.Document_UpdateSelectionState();

    for (i = 0; i < this.slidesToUnlock.length; ++i) {
        this.DrawingDocument.UnLockSlide(this.slidesToUnlock[i]);
    }
    this.slidesToUnlock.length = 0;
    this.private_UpdateCursorXY(true, true);
    if (this.Slides[this.CurPage]) {
        if (this.DrawingDocument.placeholders)
            this.DrawingDocument.placeholders.update(this.Slides[this.CurPage].getPlaceholdersControls());
    }
};

CPresentation.prototype.updateSlideIndexes = function () {
    for (var i = 0; i < this.Slides.length; ++i) {
        this.Slides[i].changeNum(i);
    }
};

CPresentation.prototype.GenerateThumbnails = function (_drawerThemes, _drawerLayouts) {
    var _masters = this.slideMasters;
    var _len = _masters.length;
    var aLayouts, i, j;
    for (i = 0; i < _len; i++) {
        _masters[i].ImageBase64 = _drawerThemes.GetThumbnail(_masters[i]);
        aLayouts = _masters[i].sldLayoutLst;
        for (j = 0; j < aLayouts.length; ++j) {
            aLayouts[j].ImageBase64 = _drawerLayouts.GetThumbnail(aLayouts[j]);
            aLayouts[j].Width64 = _drawerLayouts.WidthPx;
            aLayouts[j].Height64 = _drawerLayouts.HeightPx;
        }
    }
};

CPresentation.prototype.StopRecalculate = function () {
    this.clearThemeTimeouts();
//        this.DrawingDocument.OnStartRecalculate( 0 );
};

CPresentation.prototype.OnContentReDraw = function (StartPage, EndPage) {
    this.ReDraw(StartPage, EndPage);
};

CPresentation.prototype.CheckTargetUpdate = function () {
    if (this.DrawingDocument.UpdateTargetFromPaint === true) {
        if (true === this.DrawingDocument.UpdateTargetCheck)
            this.NeedUpdateTarget = this.DrawingDocument.UpdateTargetCheck;
        this.DrawingDocument.UpdateTargetCheck = false;
    }

    if (true === this.NeedUpdateTarget) {
        this.RecalculateCurPos();
        this.NeedUpdateTarget = false;
    }
};

CPresentation.prototype.RecalculateCurPos = function () {
    var oController = this.GetCurrentController();
    if (oController) {
        oController.recalculateCurPos();
    }
};

CPresentation.prototype.Set_TargetPos = function (X, Y, PageNum) {
    this.TargetPos.X = X;
    this.TargetPos.Y = Y;
    this.TargetPos.PageNum = PageNum;
};

// Вызываем перерисовку нужных страниц
CPresentation.prototype.ReDraw = function (StartPage, EndPage) {

    this.DrawingDocument.OnRecalculatePage(StartPage, this.Slides[StartPage]);
};

CPresentation.prototype.DrawPage = function (nPageIndex, pGraphics) {
    this.Draw(nPageIndex, pGraphics);
};


CPresentation.prototype.Update_ForeignCursor = function (CursorInfo, UserId, Show, UserShortId) {
    if (!editor.User)
        return;

    if (UserId === editor.CoAuthoringApi.getUserConnectionId())
        return;

    if (!CursorInfo) {
        this.DrawingDocument.Collaborative_RemoveTarget(UserId);
        AscCommon.CollaborativeEditing.Remove_ForeignCursor(UserId);
        return;
    }

    var Changes = new AscCommon.CCollaborativeChanges();
    var Reader = Changes.GetStream(CursorInfo, 0, CursorInfo.length);

    var RunId = Reader.GetString2();
    var InRunPos = Reader.GetLong();

    var Run = g_oTableId.Get_ById(RunId);
    if (!(Run instanceof ParaRun)) {
        this.DrawingDocument.Collaborative_RemoveTarget(UserId);
        AscCommon.CollaborativeEditing.Remove_ForeignCursor(UserId);
        return;
    }

    var CursorPos = [{Class: Run, Position: InRunPos}];
	Run.GetDocumentPositionFromObject(CursorPos);
    AscCommon.CollaborativeEditing.Add_ForeignCursor(UserId, CursorPos, UserShortId);

    if (true === Show) {

        var oTargetDocContentOrTable;
        var oController = this.GetCurrentController();
        if (oController) {
            oTargetDocContentOrTable = oController.getTargetDocContent(undefined, true);
        }

        if (!oTargetDocContentOrTable) {
            return;
        }
        var bTable = (oTargetDocContentOrTable instanceof CTable);
        AscCommon.CollaborativeEditing.Update_ForeignCursorPosition(UserId, Run, InRunPos, true, oTargetDocContentOrTable, bTable);
    }
};

CPresentation.prototype.Remove_ForeignCursor = function (UserId) {
    this.DrawingDocument.Collaborative_RemoveTarget(UserId);
    AscCommon.CollaborativeEditing.Remove_ForeignCursor(UserId);
};


CPresentation.prototype.GetTargetPosition = function () {
    var oController = this.GetCurrentController();
    var oPosition = null;
    if (oController) {
        var oTargetDocContent = oController.getTargetDocContent(false, false);
        if (oTargetDocContent) {
            var oElem = oTargetDocContent.Content[oTargetDocContent.CurPos.ContentPos];
            if (oElem) {
                var oPos = oElem.GetTargetPos();
                if (oPos) {

                }
                var x, y;
                if (oPos.Transform) {
                    x = oPos.Transform.TransformPointX(oPos.X, oPos.Y + oPos.Height);
                    y = oPos.Transform.TransformPointY(oPos.X, oPos.Y + oPos.Height);
                } else {
                    x = oPos.X;
                    y = oPos.Y + oPos.Height;
                }
                oPosition = {X: x, Y: y};
            }
        }
    }
    return oPosition;
};


// Отрисовка содержимого Документа
CPresentation.prototype.Draw = function (nPageIndex, pGraphics) {
    if (!pGraphics.IsSlideBoundsCheckerType) {
        AscCommon.CollaborativeEditing.Update_ForeignCursorsPositions();
    }
    this.Slides[nPageIndex] && this.Slides[nPageIndex].draw(pGraphics);
};

CPresentation.prototype.AddNewParagraph = function (bRecalculate) {
    var oController = this.GetCurrentController();
    oController && oController.checkSelectedObjectsAndCallback(oController.addNewParagraph, [], false, AscDFH.historydescription_Presentation_AddNewParagraph);
    this.Document_UpdateInterfaceState();
};

CPresentation.prototype.Search = function (Str, Props) {
    if (true === this.SearchEngine.Compare(Str, Props))
        return this.SearchEngine;
    this.SearchEngine.Clear();
    this.SearchEngine.Set(Str, Props);

    for (var i = 0; i < this.Slides.length; ++i) {
        this.Slides[i].Search(Str, Props, this.SearchEngine, search_Common);
    }
    this.DrawingDocument.ClearCachePages();
    this.DrawingDocument.FirePaint();
    this.SearchEngine.ClearOnRecalc = true;
    return this.SearchEngine;
};

CPresentation.prototype.Search_GetId = function (isNext) {
    if (this.Slides.length > 0) {
        var i, Id, content, start_index;
        var target_text_object;
        var oCommonController = this.GetCurrentController();
        if (oCommonController) {
            target_text_object = AscFormat.getTargetTextObject(oCommonController);
        }
        if (target_text_object) {
            if (target_text_object.getObjectType() === AscDFH.historyitem_type_GraphicFrame) {
                Id = target_text_object.graphicObject.Search_GetId(isNext, true);
                if (Id !== null) {
                    return Id;
                }
            } else {
                content = target_text_object.getDocContent();
                if (content) {
                    Id = content.Search_GetId(isNext, true);
                    if (Id !== null) {
                        return Id;
                    }
                }
            }
        }
        var sp_tree = this.Slides[this.CurPage].cSld.spTree, group_shapes, group_start_index;
        var bSkipCurNotes = false;
        if (isNext) {
            if (this.Slides[this.CurPage].graphicObjects.selection.groupSelection) {
                group_shapes = this.Slides[this.CurPage].graphicObjects.selection.groupSelection.arrGraphicObjects;
                for (i = 0; i < group_shapes.length; ++i) {
                    if (group_shapes[i].selected && group_shapes[i].getObjectType() === AscDFH.historyitem_type_Shape) {
                        content = group_shapes[i].getDocContent();
                        if (content) {
                            Id = content.Search_GetId(isNext, isRealObject(target_text_object));
                            if (Id !== null) {
                                return Id;
                            }
                        }
                        group_start_index = i + 1;
                    }
                }
                for (i = group_start_index; i < group_shapes.length; ++i) {
                    if (group_shapes[i].getObjectType() === AscDFH.historyitem_type_Shape) {
                        content = group_shapes[i].getDocContent();
                        if (content) {
                            Id = content.Search_GetId(isNext, false);
                            if (Id !== null) {
                                return Id;
                            }
                        }
                    }
                }

                for (i = 0; i < sp_tree.length; ++i) {
                    if (sp_tree[i] === this.Slides[this.CurPage].graphicObjects.selection.groupSelection) {
                        start_index = i + 1;
                        break;
                    }
                }
                if (i === sp_tree.length) {
                    start_index = sp_tree.length;
                }
            } else if (this.Slides[this.CurPage].graphicObjects.selectedObjects.length === 0) {
                start_index = 0;
                if (this.FocusOnNotes) {
                    start_index = sp_tree.length;
                    bSkipCurNotes = true;
                }
            } else {
                for (i = 0; i < sp_tree.length; ++i) {
                    if (sp_tree[i].selected) {
                        start_index = target_text_object ? i + 1 : i;
                        break;
                    }
                }
                if (i === sp_tree.length) {
                    start_index = sp_tree.length;
                }
            }
            Id = this.Slides[this.CurPage].Search_GetId(isNext, start_index);
            if (Id !== null) {
                return Id;
            }
            var oCurSlide = this.Slides[this.CurPage];
            if (oCurSlide.notesShape && !bSkipCurNotes) {
                Id = oCurSlide.notesShape.Search_GetId(isNext, false);
                if (Id !== null) {
                    return Id;
                }
            }
            for (i = this.CurPage + 1; i < this.Slides.length; ++i) {
                Id = this.Slides[i].Search_GetId(isNext, 0);
                if (Id !== null) {
                    return Id;
                }
                if (this.Slides[i].notesShape) {
                    Id = this.Slides[i].notesShape.Search_GetId(isNext, false);
                    if (Id !== null) {
                        return Id;
                    }
                }
            }
            for (i = 0; i <= this.CurPage; ++i) {
                Id = this.Slides[i].Search_GetId(isNext, 0);
                if (Id !== null) {
                    return Id;
                }
                if (this.Slides[i].notesShape) {
                    Id = this.Slides[i].notesShape.Search_GetId(isNext, false);
                    if (Id !== null) {
                        return Id;
                    }
                }
            }

        } else {
            if (this.Slides[this.CurPage].graphicObjects.selection.groupSelection) {
                group_shapes = this.Slides[this.CurPage].graphicObjects.selection.groupSelection.arrGraphicObjects;
                for (i = group_shapes.length - 1; i > -1; --i) {
                    if (group_shapes[i].selected && group_shapes[i].getObjectType() === AscDFH.historyitem_type_Shape) {
                        content = group_shapes[i].getDocContent();
                        if (content) {
                            Id = content.Search_GetId(isNext, isRealObject(target_text_object));
                            if (Id !== null) {
                                return Id;
                            }
                        }
                        group_start_index = i - 1;
                    }
                }
                for (i = group_start_index; i > -1; --i) {
                    if (group_shapes[i].getObjectType() === AscDFH.historyitem_type_Shape) {
                        content = group_shapes[i].getDocContent();
                        if (content) {
                            Id = content.Search_GetId(isNext, false);
                            if (Id !== null) {
                                return Id;
                            }
                        }
                    }
                }

                for (i = 0; i < sp_tree.length; ++i) {
                    if (sp_tree[i] === this.Slides[this.CurPage].graphicObjects.selection.groupSelection) {
                        start_index = i - 1;
                        break;
                    }
                }
                if (i === sp_tree.length) {
                    start_index = -1;
                }
            } else if (this.Slides[this.CurPage].graphicObjects.selectedObjects.length === 0) {
                start_index = sp_tree.length - 1;
            } else {
                for (i = sp_tree.length - 1; i > -1; --i) {
                    if (sp_tree[i].selected) {
                        start_index = target_text_object ? i - 1 : i;
                        break;
                    }
                }
                if (i === sp_tree.length) {
                    start_index = -1;
                }
            }
            Id = this.Slides[this.CurPage].Search_GetId(isNext, start_index);
            if (Id !== null) {
                return Id;
            }
            for (i = this.CurPage - 1; i > -1; --i) {
                if (this.Slides[i].notesShape) {
                    Id = this.Slides[i].notesShape.Search_GetId(isNext, false);
                    if (Id !== null) {
                        return Id;
                    }
                }
                Id = this.Slides[i].Search_GetId(isNext, this.Slides[i].cSld.spTree.length - 1);
                if (Id !== null) {
                    return Id;
                }
            }
            for (i = this.Slides.length - 1; i >= this.CurPage; --i) {
                if (this.Slides[i].notesShape) {
                    Id = this.Slides[i].notesShape.Search_GetId(isNext, false);
                    if (Id !== null) {
                        return Id;
                    }
                }
                Id = this.Slides[i].Search_GetId(isNext, this.Slides[i].cSld.spTree.length - 1);
                if (Id !== null) {
                    return Id;
                }
            }
        }
    }
    return null;
};

CPresentation.prototype.Search_Select = function (Id) {
    this.SearchEngine.Select(Id);

    this.Document_UpdateInterfaceState();
    this.Document_UpdateSelectionState();
    // this.Document_UpdateRulersState();
    editor.WordControl.OnUpdateOverlay();
};

CPresentation.prototype.Search_Replace = function (NewStr, bAll, Id, bInterfaceEvent) {
    var bResult = false;

    var oController = this.GetCurrentController();
    if (!oController) {
        return bResult;
    }
    var oContent = oController.getTargetDocContent();
    if (oContent) {
        oContent.RemoveSelection();
    }

    var CheckParagraphs = [];
    if (true === bAll) {
        var CheckParagraphsObj = {};
        for (var Id in this.SearchEngine.Elements) {
            CheckParagraphsObj[this.SearchEngine.Elements[Id].Get_Id()] = this.SearchEngine.Elements[Id];
        }

        for (var ParaId in CheckParagraphsObj) {
            CheckParagraphs.push(CheckParagraphsObj[ParaId]);
        }
    } else {
        if (undefined !== this.SearchEngine.Elements[Id])
            CheckParagraphs.push(this.SearchEngine.Elements[Id]);
    }

    var AllCount = this.SearchEngine.Count;


    AscCommon.History.Create_NewPoint(bAll ? AscDFH.historydescription_Document_ReplaceAll : AscDFH.historydescription_Document_ReplaceSingle);

    if (true === bAll) {
        this.SearchEngine.Replace_All(NewStr, true);
    } else {
        this.SearchEngine.Replace(NewStr, Id, false);

        // TODO: В будушем надо будет переделать, чтобы искалось заново только в том параграфе, в котором произошла замена
        //       Тут появляется проблема с вложенным поиском, если то что мы заменяем содержится в том, на что мы заменяем.
        if (true === this.IsTrackRevisions())
            this.SearchEngine.Reset();
    }

    this.SearchEngine.ClearOnRecalc = false;
    this.TurnOffInterfaceEvents = true;
    this.Recalculate();
    this.SearchEngine.ClearOnRecalc = true;
    this.RecalculateCurPos();
    this.TurnOffInterfaceEvents = false;
    bResult = true;

    if (true === bAll && false !== bInterfaceEvent)
        editor.sync_ReplaceAllCallback(AllCount, AllCount);


    return bResult;
};


CPresentation.prototype.findText = function (text, scanForward) {
    if (typeof (text) != "string") {
        return;
    }
    if (scanForward === undefined) {
        scanForward = true;
    }

    var slide_num;
    var search_select_data = null;
    if (scanForward) {
        for (slide_num = this.CurPage; slide_num < this.Slides.length; ++slide_num) {
            search_select_data = this.Slides[slide_num].graphicObjects.startSearchText(text, scanForward);
            if (search_select_data != null) {
                this.DrawingDocument.m_oWordControl.GoToPage(slide_num);
                this.Slides[slide_num].graphicObjects.setSelectionState(search_select_data);
                this.Document_UpdateSelectionState();
                return true;
            }
        }
        for (slide_num = 0; slide_num <= this.CurPage; ++slide_num) {
            search_select_data = this.Slides[slide_num].graphicObjects.startSearchText(text, scanForward, true);
            if (search_select_data != null) {
                this.DrawingDocument.m_oWordControl.GoToPage(slide_num);
                this.Slides[slide_num].graphicObjects.setSelectionState(search_select_data);
                this.Document_UpdateSelectionState();
                return true;
            }
        }
    } else {
        for (slide_num = this.CurPage; slide_num > -1; --slide_num) {
            search_select_data = this.Slides[slide_num].graphicObjects.startSearchText(text, scanForward);
            if (search_select_data != null) {
                this.DrawingDocument.m_oWordControl.GoToPage(slide_num);
                this.Slides[slide_num].graphicObjects.setSelectionState(search_select_data);
                this.Document_UpdateSelectionState();
                return true;
            }
        }
        for (slide_num = this.Slides.length - 1; slide_num >= this.CurPage; --slide_num) {
            search_select_data = this.Slides[slide_num].graphicObjects.startSearchText(text, scanForward, true);
            if (search_select_data != null) {
                this.DrawingDocument.m_oWordControl.GoToPage(slide_num);
                this.Slides[slide_num].graphicObjects.setSelectionState(search_select_data);
                this.Document_UpdateSelectionState();
                return true;
            }
        }
    }

    return false;
};

CPresentation.prototype.groupShapes = function () {
    var oController = this.GetCurrentController();
    oController && oController.checkSelectedObjectsAndCallback(oController.createGroup, [], false, AscDFH.historydescription_Presentation_CreateGroup);
    this.Document_UpdateInterfaceState();
};

CPresentation.prototype.unGroupShapes = function () {
    var oController = this.GetCurrentController();
    oController && oController.checkSelectedObjectsAndCallback(oController.unGroupCallback, [], false, AscDFH.historydescription_Presentation_UnGroup);
    this.Document_UpdateInterfaceState();
};

CPresentation.prototype.addImages = function (aImages, placeholder) {
    if (this.Slides[this.CurPage] && aImages.length) {
        editor.WordControl.Thumbnails && editor.WordControl.Thumbnails.SetFocusElement(FOCUS_OBJECT_MAIN);
        this.FocusOnNotes = false;
        var oController = this.Slides[this.CurPage].graphicObjects;
        if (placeholder && undefined !== placeholder.id && aImages.length === 1 && aImages[0].Image) {
            var oPh = AscCommon.g_oTableId.Get_ById(placeholder.id);
            if (oPh) {
                var oPh = AscCommon.g_oTableId.Get_ById(placeholder.id);
                if (oPh) {

                    History.Create_NewPoint(AscDFH.historydescription_Presentation_AddFlowImage);
                    oController.resetSelection();
                    var _w, _h;
                    var _image = aImages[0];
                    _w = oPh.extX;
                    _h = oPh.extY;
                    var __w = Math.max((_image.Image.width * AscCommon.g_dKoef_pix_to_mm), 1);
                    var __h = Math.max((_image.Image.height * AscCommon.g_dKoef_pix_to_mm), 1);
                    var fKoeff = Math.min(_w / __w, _h / __h);
                    _w = Math.max(5, __w * fKoeff);
                    _h = Math.max(5, __h * fKoeff);
                    var Image = oController.createImage(_image.src, oPh.x + oPh.extX / 2.0 - _w / 2.0, oPh.y + oPh.extY / 2.0 - _h / 2.0, _w, _h, _image.videoUrl, _image.audioUrl);
                    if(AscFormat.isRealNumber(oPh.rot)) {
                        if(Image.spPr && Image.spPr.xfrm) {
                            Image.spPr.xfrm.setRot(oPh.rot);
                        }
                    }
                    Image.setParent(this.Slides[this.CurPage]);
                    if (this.Document_Is_SelectionLocked(AscCommon.changestype_Drawing_Props, undefined, undefined, [oPh])) {
                        Image.addToDrawingObjects();
                    }
                    else {
                        this.Slides[this.CurPage].replaceSp(oPh, Image);
                    }
                    oController.selectObject(Image, 0);
                    this.Recalculate();
                    this.Document_UpdateInterfaceState();
                    this.CheckEmptyPlaceholderNotes();
                    return;
                } else {
                    return;
                }
            }
        }
        History.Create_NewPoint(AscDFH.historydescription_Presentation_AddFlowImage);
        oController.resetSelection();
        var _w, _h;
        for (var i = 0; i < aImages.length; ++i) {
            var _image = aImages[i];
            if(_image.Image) {
                _w = this.Slides[this.CurPage].Width;
                _h = this.Slides[this.CurPage].Height;
                var __w = Math.max((_image.Image.width * AscCommon.g_dKoef_pix_to_mm), 1);
                var __h = Math.max((_image.Image.height * AscCommon.g_dKoef_pix_to_mm), 1);
                var fKoeff = Math.min(1.0, 1.0 / Math.max(__w / _w, __h / _h));
                _w = Math.max(5, __w * fKoeff);
                _h = Math.max(5, __h * fKoeff);
                var Image = oController.createImage(_image.src, (this.Slides[this.CurPage].Width - _w) / 2, (this.Slides[this.CurPage].Height - _h) / 2, _w, _h, _image.videoUrl, _image.audioUrl);
                Image.setParent(this.Slides[this.CurPage]);
                Image.addToDrawingObjects();
                oController.selectObject(Image, 0);
            }
        }
        this.Recalculate();
        this.Document_UpdateInterfaceState();
        this.CheckEmptyPlaceholderNotes();
    }
};

CPresentation.prototype.AddOleObject = function (fWidth, fHeight, nWidthPix, nHeightPix, sLocalUrl, sData, sApplicationId) {
    if (this.Slides[this.CurPage]) {
        var fPosX = (this.Width - fWidth) / 2;
        var fPosY = (this.Height - fHeight) / 2;
        var oController = this.Slides[this.CurPage].graphicObjects;
        var Image = oController.createOleObject(sData, sApplicationId, sLocalUrl, fPosX, fPosY, fWidth, fHeight, nWidthPix, nHeightPix);
        Image.setParent(this.Slides[this.CurPage]);
        Image.addToDrawingObjects();
        oController.resetSelection();
        oController.selectObject(Image, 0);
        this.Recalculate();
        this.Document_UpdateInterfaceState();
    }
};

CPresentation.prototype.EditOleObject = function (oOleObject, sData, sImageUrl, nPixWidth, nPixHeight) {
    oOleObject.setData(sData);
    var _blipFill = new AscFormat.CBlipFill();
    _blipFill.RasterImageId = sImageUrl;
    oOleObject.setBlipFill(_blipFill);
    oOleObject.setPixSizes(nPixWidth, nPixHeight);
};


CPresentation.prototype.Get_AbsolutePage = function () {
    return 0;
};

CPresentation.prototype.Get_AbsoluteColumn = function () {
    return 0;
};


CPresentation.prototype.addChart = function (binary, isFromInterface, Placeholder) {
    var _this = this;
    var oSlide = _this.Slides[_this.CurPage];
    if (!oSlide) {
        return;
    }
    History.Create_NewPoint(AscDFH.historydescription_Presentation_AddChart);
    editor.WordControl.Thumbnails && editor.WordControl.Thumbnails.SetFocusElement(FOCUS_OBJECT_MAIN);
    _this.FocusOnNotes = false;
    var Image = oSlide.graphicObjects.getChartSpace2(binary, null);
    Image.setParent(oSlide);

    var PosX = (oSlide.Width - Image.spPr.xfrm.extX) / 2;
    var PosY = (oSlide.Height - Image.spPr.xfrm.extY) / 2;
    if (Placeholder) {
        var oPh = AscCommon.g_oTableId.Get_ById(Placeholder.id);
        if (oPh) {
            PosX = oPh.x;
            PosY = oPh.y;
            Image.spPr.xfrm.setExtX(oPh.extX);
            Image.spPr.xfrm.setExtY(oPh.extY);
            if (this.Document_Is_SelectionLocked(AscCommon.changestype_Drawing_Props, undefined, undefined, [oPh])) {
                Image.addToDrawingObjects();
            }
            else {
                oSlide.replaceSp(oPh, Image);
            }
        } else {
            return;
        }
    } else {
        Image.addToDrawingObjects();
    }

    Image.spPr.xfrm.setOffX(PosX);
    Image.spPr.xfrm.setOffY(PosY);
    oSlide.graphicObjects.resetSelection();
    oSlide.graphicObjects.selectObject(Image, 0);

    if (isFromInterface) {
        AscFonts.FontPickerByCharacter.checkText("", this, function () {
            _this.Recalculate();
            _this.Document_UpdateInterfaceState();
            _this.CheckEmptyPlaceholderNotes();

            this.DrawingDocument.m_oWordControl.OnUpdateOverlay();
        }, false, false, false);
    } else {
        _this.Recalculate();
        _this.Document_UpdateInterfaceState();
        _this.CheckEmptyPlaceholderNotes();

        this.DrawingDocument.m_oWordControl.OnUpdateOverlay();
    }
};

CPresentation.prototype.RemoveSelection = function (bNoResetChartSelection) {
    var oController = this.GetCurrentController();
    if (oController) {
        oController.resetSelection(undefined, bNoResetChartSelection);
    }
};

CPresentation.prototype.EditChart = function (binary) {
    var _this = this;
    _this.Slides[_this.CurPage] && _this.Slides[_this.CurPage].graphicObjects.checkSelectedObjectsAndCallback(function () {
        _this.Slides[_this.CurPage].graphicObjects.editChart(binary);
        _this.Document_UpdateInterfaceState();
    }, [binary], false, AscDFH.historydescription_Presentation_EditChart);
};

CPresentation.prototype.GetChartObject = function (type) {
    return this.Slides[this.CurPage].graphicObjects.getChartObject(type);
};

CPresentation.prototype.Check_GraphicFrameRowHeight = function (grFrame, bIgnoreHeight) {
    grFrame.recalculate();
    var content = grFrame.graphicObject.Content, i, j;
    for (i = 0; i < content.length; ++i) {
        var row = content[i];
        if (!bIgnoreHeight && row.Pr && row.Pr.Height && row.Pr.Height.HRule === Asc.linerule_AtLeast
            && AscFormat.isRealNumber(row.Pr.Height.Value) && row.Pr.Height.Value > 0) {
            continue;
        }
        var fMaxTopMargin = 0, fMaxBottomMargin = 0, fMaxTopBorder = 0, fMaxBottomBorder = 0;
        for (j = 0; j < row.Content.length; ++j) {
            var oCell = row.Content[j];
            var oMargins = oCell.GetMargins();
            if (oMargins.Bottom.W > fMaxBottomMargin) {
                fMaxBottomMargin = oMargins.Bottom.W;
            }
            if (oMargins.Top.W > fMaxTopMargin) {
                fMaxTopMargin = oMargins.Top.W;
            }
            var oBorders = oCell.Get_Borders();
            if (oBorders.Top.Size > fMaxTopBorder) {
                fMaxTopBorder = oBorders.Top.Size;
            }
            if (oBorders.Bottom.Size > fMaxBottomBorder) {
                fMaxBottomBorder = oBorders.Bottom.Size;
            }
        }
        row.Set_Height(row.Height - fMaxTopMargin - fMaxBottomMargin - fMaxTopBorder / 2 - fMaxBottomBorder / 2, Asc.linerule_AtLeast);
    }
};

CPresentation.prototype.Add_FlowTable = function (Cols, Rows, Placeholder) {
    if (!this.Slides[this.CurPage])
        return;

    var Width = undefined, Height = undefined, oPh, X = undefined, Y = undefined;
    var bLocked = false;
    if (Placeholder) {
        oPh = AscCommon.g_oTableId.Get_ById(Placeholder.id);
        if (oPh) {
            if (this.Document_Is_SelectionLocked(AscCommon.changestype_Drawing_Props, undefined, undefined, [oPh])) {
                bLocked = true;
            }
            Width = oPh.extX;
            X = oPh.x;
            Y = oPh.y;
        } else {
            return;
        }
    }
    History.Create_NewPoint(AscDFH.historydescription_Presentation_AddFlowTable);
    var graphic_frame = this.Create_TableGraphicFrame(Cols, Rows, this.Slides[this.CurPage], this.DefaultTableStyleId, Width, Height, X, Y);
    var oSlide = this.Slides[this.CurPage];
    editor.WordControl.Thumbnails && editor.WordControl.Thumbnails.SetFocusElement(FOCUS_OBJECT_MAIN);
    this.FocusOnNotes = false;
    this.Check_GraphicFrameRowHeight(graphic_frame);
    if (oPh && !bLocked) {
        oSlide.replaceSp(oPh, graphic_frame);
    } else {
        oSlide.addToSpTreeToPos(oSlide.cSld.spTree.length, graphic_frame);
    }
    graphic_frame.Set_CurrentElement();
    graphic_frame.graphicObject.MoveCursorToStartPos();
    this.Recalculate();
    this.Document_UpdateInterfaceState();
};


CPresentation.prototype.Create_TableGraphicFrame = function (Cols, Rows, Parent, StyleId, Width, Height, PosX, PosY, bInline) {
    var W;
    if (AscFormat.isRealNumber(Width)) {
        W = Width;
    } else {
        W = this.Width * 2 / 3;
    }
    var X, Y;
    if (AscFormat.isRealNumber(PosX) && AscFormat.isRealNumber(PosY)) {
        X = PosX;
        Y = PosY;
    } else {
        X = (this.Width - W) / 2;
        Y = this.Height / 5;
    }
    var Inline = false;
    if (AscFormat.isRealBool(bInline)) {
        Inline = bInline;
    }
    var Grid = [];

    for (var Index = 0; Index < Cols; Index++)
        Grid[Index] = W / Cols;

    var RowHeight;
    if (AscFormat.isRealNumber(Height)) {
        RowHeight = Height / Rows;
    }

    var graphic_frame = new AscFormat.CGraphicFrame();
    graphic_frame.setParent(Parent);
    graphic_frame.setSpPr(new AscFormat.CSpPr());
    graphic_frame.spPr.setParent(graphic_frame);
    graphic_frame.spPr.setXfrm(new AscFormat.CXfrm());
    graphic_frame.spPr.xfrm.setParent(graphic_frame.spPr);
    graphic_frame.spPr.xfrm.setOffX(X);
    graphic_frame.spPr.xfrm.setOffY(Y);
    graphic_frame.spPr.xfrm.setExtX(W);
    graphic_frame.spPr.xfrm.setExtY(7.478268771701388 * Rows);
    graphic_frame.setNvSpPr(new AscFormat.UniNvPr());

    var table = new CTable(this.DrawingDocument, graphic_frame, Inline, Rows, Cols, Grid, true);
    table.Reset(Inline ? X : 0, Inline ? Y : 0, W, 100000, 0, 0, 1, 0);
    if (!Inline) {
        table.Set_PositionH(Asc.c_oAscHAnchor.Page, false, 0);
        table.Set_PositionV(Asc.c_oAscVAnchor.Page, false, 0);
    }
    table.SetTableLayout(tbllayout_Fixed);
    if (typeof StyleId === "string") {
        table.Set_TableStyle(StyleId);
    }
    table.Set_TableLook(new CTableLook(false, true, false, false, true, false));
    for (var i = 0; i < table.Content.length; ++i) {
        var Row = table.Content[i];
        if (AscFormat.isRealNumber(RowHeight)) {
            Row.Set_Height(RowHeight, Asc.linerule_AtLeast);
        }
        //for(var j = 0; j < Row.Content.length; ++j)
        //{
        //    var cell = Row.Content[j];
        //    var props = new CTableCellPr();
        //    props.TableCellMar = {};
        //    props.TableCellMar.Top    = new CTableMeasurement(tblwidth_Mm, 1.27);
        //    props.TableCellMar.Left   = new CTableMeasurement(tblwidth_Mm, 2.54);
        //    props.TableCellMar.Bottom = new CTableMeasurement(tblwidth_Mm, 1.27);
        //    props.TableCellMar.Right  = new CTableMeasurement(tblwidth_Mm, 2.54);
        //    props.Merge(cell.Pr);
        //    cell.Set_Pr(props);
        //}
    }
    graphic_frame.setGraphicObject(table);
    graphic_frame.setBDeleted(false);
    return graphic_frame;
};

CPresentation.prototype.Set_MathProps = function (oMathProps) {

    var oController = this.GetCurrentController();
    if (oController) {
        oController.setMathProps(oMathProps);
    }
};


CPresentation.prototype.AddToParagraph = function (ParaItem, bRecalculate, noUpdateInterface) {
    if (this.Slides[this.CurPage]) {
        var oMathShape = null;
        if (ParaItem.Type === para_Math) {
            var oController = this.Slides[this.CurPage].graphicObjects;
            if (!this.FocusOnNotes && !(oController.selection.textSelection || (oController.selection.groupSelection && oController.selection.groupSelection.selection.textSelection))) {
                this.Slides[this.CurPage].graphicObjects.resetSelection();
                var oMathShape = oController.createTextArt(0, false, null, "");
                oMathShape.addToDrawingObjects();
                oMathShape.select(oController, this.CurPage);
                oController.selection.textSelection = oMathShape;
                oMathShape.txBody.content.MoveCursorToStartPos(false);
            }
        }
        if (this.FocusOnNotes) {
            var oCurSlide = this.Slides[this.CurPage];
            if (oCurSlide.notes) {
                oCurSlide.notes.graphicObjects.paragraphAdd(ParaItem, bRecalculate);
                bRecalculate = false;
            }
        } else {
            this.Slides[this.CurPage].graphicObjects.paragraphAdd(ParaItem, bRecalculate);
            var oTargetTextObject = AscFormat.getTargetTextObject(this.Slides[this.CurPage].graphicObjects);
            if (!oTargetTextObject || oTargetTextObject instanceof AscFormat.CGraphicFrame) {
                bRecalculate = false;
            }
            if (oMathShape) {
                oMathShape.checkExtentsByDocContent();
                oMathShape.spPr.xfrm.setOffX((this.Slides[this.CurPage].Width - oMathShape.spPr.xfrm.extX) / 2);
                oMathShape.spPr.xfrm.setOffY((this.Slides[this.CurPage].Height - oMathShape.spPr.xfrm.extY) / 2);
            }
        }
        if (false === bRecalculate) {
            this.Recalculate();
            this.Slides[this.CurPage].graphicObjects.recalculateCurPos();
            var oContent = this.Slides[this.CurPage].graphicObjects.getTargetDocContent(false, false);
            if (oContent) {
                var oCurrentParagraph = oContent.GetCurrentParagraph(true);
                if (oCurrentParagraph && oCurrentParagraph.GetType() === type_Paragraph) {
                    oCurrentParagraph.CurPos.RealX = oCurrentParagraph.CurPos.X;
                    oCurrentParagraph.CurPos.RealY = oCurrentParagraph.CurPos.Y;
                }
            }

        }
        //this.Slides[this.CurPage].graphicObjects.startRecalculate();
        //this.Slides[this.CurPage].graphicObjects.recalculateCurPos();
        if (!(noUpdateInterface === true) || (editor.asc_getKeyboardLanguage() !== -1)) {
            this.Document_UpdateInterfaceState();
            this.Document_UpdateRulersState();
        }
        this.NeedUpdateTargetForCollaboration = true;
    }
    // this.Slides[this.CurPage] && this.Slides[this.CurPage].graphicObjects.checkSelectedObjectsAndCallback(this.Slides[this.CurPage].graphicObjects.paragraphAdd, [ParaItem, bRecalculate], false, AscDFH.historydescription_Presentation_ParagraphAdd, true);

};

CPresentation.prototype.ClearParagraphFormatting = function (isClearParaPr, isClearTextPr) {
    var oController = this.GetCurrentController();
    oController && oController.checkSelectedObjectsAndCallback(oController.paragraphClearFormatting, [isClearParaPr, isClearTextPr], false, AscDFH.historydescription_Presentation_ParagraphClearFormatting);
    this.Document_UpdateInterfaceState();
};

CPresentation.prototype.GetSelectedBounds = function () {
    var oController = this.GetCurrentController();
    if (oController && oController.selectedObjects.length > 0) {
        return oController.getBoundsForGroup([oController.selectedObjects[0]]);
    }
    return new AscFormat.CGraphicBounds(0, 0, 0, 0);
};

CPresentation.prototype.GetFocusObjType = function () {
    if (!window["NATIVE_EDITOR_ENJINE"] && editor.WordControl.Thumbnails) {
        return editor.WordControl.Thumbnails.FocusObjType;
    } else {
        var oCurController = this.GetCurrentController();
        if (oCurController) {
            return oCurController.selectedObjects.length > 0 ? FOCUS_OBJECT_MAIN : FOCUS_OBJECT_THUMBNAILS;
        }
        return FOCUS_OBJECT_THUMBNAILS;
    }
};

CPresentation.prototype.GetSelectedSlides = function () {
    if (!window["NATIVE_EDITOR_ENJINE"] && editor.WordControl.Thumbnails) {
        return editor.WordControl.Thumbnails.GetSelectedArray();
    } else {
        return [this.CurPage];
    }
};

CPresentation.prototype.RemoveCurrentComment = function () {
    if (!this.FocusOnNotes) {
        var oCurSlide = this.Slides[this.CurPage];
        if (oCurSlide && oCurSlide.slideComments) {
            var oSelectedComment = oCurSlide.slideComments.getSelectedComment();
            if (oSelectedComment) {
                var aCommentData = [{comment: oSelectedComment, slide: oCurSlide}];
                if (this.Document_Is_SelectionLocked(AscCommon.changestype_MoveComment, aCommentData, this.IsEditCommentsMode()) === false) {
                    this.Create_NewHistoryPoint(AscDFH.historydescription_Presentation_RemoveComment);
                    this.RemoveComment(oSelectedComment.Id, true);
                    return true;
                }

            }
        }
    }
    return false;
};


CPresentation.prototype.RemoveMyComments = function () {
    var aAllMyComments = [];
    this.GetAllMyComments(aAllMyComments);
    if (this.Document_Is_SelectionLocked(AscCommon.changestype_MoveComment, aAllMyComments, this.IsEditCommentsMode()) === false) {
        this.Create_NewHistoryPoint(AscDFH.historydescription_Presentation_RemoveComment);
        this.comments.removeMyComments();
        for (var i = 0; i < this.Slides.length; ++i) {
            this.Slides[i].removeMyComments();
        }
        this.Recalculate();
    }
};

CPresentation.prototype.GetAllMyComments = function (aAllComments) {
    this.comments.getAllMyComments(aAllComments, null);
    for (var i = 0; i < this.Slides.length; ++i) {
        this.Slides[i].getAllMyComments(aAllComments);
    }
};


CPresentation.prototype.RemoveAllComments = function () {
    var aAllMyComments = [];
    this.GetAllComments(aAllMyComments);
    if (this.Document_Is_SelectionLocked(AscCommon.changestype_MoveComment, aAllMyComments, this.IsEditCommentsMode()) === false) {
        this.Create_NewHistoryPoint(AscDFH.historydescription_Presentation_RemoveComment);
        this.comments.removeAllComments();
        for (var i = 0; i < this.Slides.length; ++i) {
            this.Slides[i].removeAllComments();
        }
        this.Recalculate();
    }
};
CPresentation.prototype.GetAllComments = function (aAllComments) {
    this.comments.getAllComments(aAllComments, null);
    for (var i = 0; i < this.Slides.length; ++i) {
        this.Slides[i].getAllComments(aAllComments);
    }
};

CPresentation.prototype.Remove = function (Count, bOnlyText, bRemoveOnlySelection, bOnTextAdd, isWord) {
    if (this.GetFocusObjType() === FOCUS_OBJECT_THUMBNAILS) {
        this.deleteSlides(this.GetSelectedSlides());
        return;
    }
    if ("undefined" === typeof (bRemoveOnlySelection))
        bRemoveOnlySelection = false;

    var oController = this.GetCurrentController();
    if (this.RemoveCurrentComment()) {
        return;
    }
    if (oController && oController.selectedObjects.length !== 0) {
        oController.remove(Count, bOnlyText, bRemoveOnlySelection, bOnTextAdd, isWord);
        this.Document_UpdateInterfaceState();
    }
};


CPresentation.prototype.MoveCursorToStartPos = function () {
    var oController = this.GetCurrentController();
    oController && oController.cursorMoveToStartPos();
    this.private_UpdateCursorXY(true, true);
    this.Document_UpdateSelectionState();
    this.Document_UpdateInterfaceState();
    return true;
};

CPresentation.prototype.MoveCursorToEndPos = function () {
    var oController = this.GetCurrentController();
    oController && oController.cursorMoveToEndPos();
    this.private_UpdateCursorXY(true, true);
    this.Document_UpdateSelectionState();
    this.Document_UpdateInterfaceState();
    return true;
};

CPresentation.prototype.MoveCursorLeft = function (AddToSelect, Word) {
    var oController = this.GetCurrentController();
    oController && oController.cursorMoveLeft(AddToSelect, Word);
    this.private_UpdateCursorXY(true, true);
    this.Document_UpdateInterfaceState();
    return true;
};

CPresentation.prototype.MoveCursorRight = function (AddToSelect, Word) {
    var oController = this.GetCurrentController();
    oController && oController.cursorMoveRight(AddToSelect, Word);
    this.private_UpdateCursorXY(true, true);
    this.Document_UpdateInterfaceState();
    return true;
};

CPresentation.prototype.MoveCursorUp = function (AddToSelect, CtrlKey) {
    var oController = this.GetCurrentController();
    oController && oController.cursorMoveUp(AddToSelect, CtrlKey);
    this.private_UpdateCursorXY(true, true);
    this.Document_UpdateInterfaceState();
    return true;
};

CPresentation.prototype.MoveCursorDown = function (AddToSelect, CtrlKey) {
    var oController = this.GetCurrentController();
    oController && oController.cursorMoveDown(AddToSelect, CtrlKey);
    this.private_UpdateCursorXY(true, true);
    this.Document_UpdateInterfaceState();
    return true;
};

CPresentation.prototype.MoveCursorToEndOfLine = function (AddToSelect) {
    var oController = this.GetCurrentController();
    oController && oController.cursorMoveEndOfLine(AddToSelect);
    this.private_UpdateCursorXY(true, true);
    this.Document_UpdateInterfaceState();
    return true;
};

CPresentation.prototype.MoveCursorToStartOfLine = function (AddToSelect) {
    var oController = this.GetCurrentController();
    oController && oController.cursorMoveStartOfLine(AddToSelect);
    this.private_UpdateCursorXY(true, true);
    this.Document_UpdateInterfaceState();
    return true;
};

CPresentation.prototype.MoveCursorToXY = function (X, Y, AddToSelect) {
    var oController = this.GetCurrentController();
    oController && oController.cursorMoveAt(X, Y, AddToSelect);
    this.private_UpdateCursorXY(true, true);
    this.Document_UpdateInterfaceState();
    return true;
};

CPresentation.prototype.MoveCursorToCell = function (bNext) {

};

/**
 * Проверяем будет ли добавление текста на ивенте KeyDown
 * @param e
 * @returns {Number[]} Массив юникодных значений
 */
CPresentation.prototype.GetAddedTextOnKeyDown = function (e) {
    if (e.KeyCode === 32) // Space
    {
        var oController = this.GetCurrentController();
        if (oController) {

            var oTargetDocContent = oController.getTargetDocContent();
            if (oTargetDocContent) {
                var oSelectedInfo = new CSelectedElementsInfo();
                oTargetDocContent.GetSelectedElementsInfo(oSelectedInfo);
                var oMath = oSelectedInfo.Get_Math();

                if (!oMath) {
                    if (true === e.ShiftKey && true === e.CtrlKey)
                        return [0x00A0];
                }
            }
        }
    } else if (e.KeyCode == 69 && true === e.CtrlKey) // Ctrl + E + ...
    {
        if (true === e.AltKey) // Ctrl + Alt + E - добавляем знак евро €
            return [0x20AC];
    } else if (e.KeyCode == 189) // Клавиша Num-
    {
        if (true === e.CtrlKey && true === e.ShiftKey)
            return [0x2013];
    }

    return [];
};

CPresentation.prototype.Get_PresentationBulletByNumInfo = function (NumInfo) {
    return AscFormat.fGetPresentationBulletByNumInfo(NumInfo);
};

CPresentation.prototype.SetParagraphAlign = function (Align) {

    var oController = this.GetCurrentController();
    oController && oController.checkSelectedObjectsAndCallback(oController.setParagraphAlign, [Align], false, AscDFH.historydescription_Presentation_SetParagraphAlign);
    this.Document_UpdateInterfaceState();
};

CPresentation.prototype.SetParagraphSpacing = function (Spacing) {
    var oController = this.GetCurrentController();
    oController && oController.checkSelectedObjectsAndCallback(oController.setParagraphSpacing, [Spacing], false, AscDFH.historydescription_Presentation_SetParagraphSpacing);
    this.Document_UpdateInterfaceState();
};

CPresentation.prototype.SetParagraphTabs = function (Tabs) {
    var oController = this.GetCurrentController();
    oController && oController.checkSelectedObjectsAndCallback(oController.setParagraphTabs, [Tabs], false, AscDFH.historydescription_Presentation_SetParagraphTabs);
    this.Document_UpdateInterfaceState();
};

CPresentation.prototype.SetParagraphIndent = function (Ind) {
    var oController = this.GetCurrentController();
    oController && oController.checkSelectedObjectsAndCallback(oController.setParagraphIndent, [Ind], false, AscDFH.historydescription_Presentation_SetParagraphIndent);
    this.Document_UpdateInterfaceState();
};

CPresentation.prototype.SetParagraphNumbering = function (NumInfo, Size, Unicolor, nNumStartAt) {
    var oController = this.GetCurrentController();
    oController && oController.checkSelectedObjectsAndCallback(oController.setParagraphNumbering, [this.Get_PresentationBulletByNumInfo(NumInfo), Size, Unicolor, nNumStartAt], false, AscDFH.historydescription_Presentation_SetParagraphNumbering);
    this.Document_UpdateInterfaceState();   //TODO
};

CPresentation.prototype.IncreaseDecreaseFontSize = function (bIncrease) {
    var oController = this.GetCurrentController();
    oController && oController.checkSelectedObjectsAndCallback(oController.paragraphIncDecFontSize, [bIncrease], false, AscDFH.historydescription_Presentation_ParagraphIncDecFontSize);
    this.Document_UpdateInterfaceState();
};

CPresentation.prototype.IncreaseDecreaseIndent = function (bIncrease) {
    var oController = this.GetCurrentController();
    oController && oController.checkSelectedObjectsAndCallback(oController.paragraphIncDecIndent, [bIncrease], false, AscDFH.historydescription_Presentation_ParagraphIncDecIndent);
    this.Document_UpdateInterfaceState();
};

CPresentation.prototype.Can_IncreaseParagraphLevel = function (bIncrease) {
    var oController = this.GetCurrentController();
    return oController && oController.canIncreaseParagraphLevel(bIncrease);
};

CPresentation.prototype.SetImageProps = function (Props) {
    var oController = this.GetCurrentController();
    if (!oController) {
        return;
    }
    var aAdditionalObjects = null;
    if (AscFormat.isRealNumber(Props.Width) && AscFormat.isRealNumber(Props.Height)) {
        aAdditionalObjects = oController.getConnectorsForCheck2();
    }
    oController.checkSelectedObjectsAndCallback(oController.applyDrawingProps, [Props], false, AscDFH.historydescription_Presentation_SetImageProps, aAdditionalObjects);
    this.Document_UpdateInterfaceState();
};

CPresentation.prototype.ShapeApply = function (shapeProps) {
    var oController = this.GetCurrentController();
    if (!oController) {
        return;
    }
    var aAdditionalObjects = null;
    if (AscFormat.isRealNumber(shapeProps.Width) && AscFormat.isRealNumber(shapeProps.Height)) {
        aAdditionalObjects = oController.getConnectorsForCheck2();
    }
    oController.checkSelectedObjectsAndCallback(oController.applyDrawingProps, [shapeProps], false, AscDFH.historydescription_Presentation_SetShapeProps, aAdditionalObjects);
    this.Document_UpdateInterfaceState();
};

CPresentation.prototype.ChartApply = function (chartProps) {
    var oController = this.GetCurrentController();
    if (!oController) {
        return;
    }
    var aAdditionalObjects = null;
    if (AscFormat.isRealNumber(chartProps.Width) && AscFormat.isRealNumber(chartProps.Height)) {
        aAdditionalObjects = oController.getConnectorsForCheck2();
    }
    oController.checkSelectedObjectsAndCallback(oController.applyDrawingProps, [chartProps], false, AscDFH.historydescription_Presentation_ChartApply, aAdditionalObjects);
    this.Document_UpdateInterfaceState();
};

CPresentation.prototype.changeShapeType = function (shapeType) {
    var oController = this.GetCurrentController();
    oController && oController.checkSelectedObjectsAndCallback(oController.applyDrawingProps, [{type: shapeType}], false, AscDFH.historydescription_Presentation_ChangeShapeType);
    this.Document_UpdateInterfaceState();
};

CPresentation.prototype.setVerticalAlign = function (align) {
    var oController = this.GetCurrentController();
    oController && oController.checkSelectedObjectsAndCallback(oController.applyDrawingProps, [{verticalTextAlign: align}], false, AscDFH.historydescription_Presentation_SetVerticalAlign);
    this.Document_UpdateInterfaceState();
};
CPresentation.prototype.setVert = function (align) {
    var oController = this.GetCurrentController();
    oController && oController.checkSelectedObjectsAndCallback(oController.applyDrawingProps, [{vert: align}], false, AscDFH.historydescription_Presentation_SetVert);
    this.Document_UpdateInterfaceState();
};

CPresentation.prototype.Get_Styles = function () {
    var styles = new CStyles();
    return {styles: styles, lastId: styles.Get_Default_Paragraph()}
};

CPresentation.prototype.IsTableCellContent = function (isReturnCell) {
    if (true === isReturnCell)
        return null;

    return false;
};

CPresentation.prototype.Check_AutoFit = function () {
    return false;
};


CPresentation.prototype.Get_Theme = function () {
    return this.slideMasters[0].Theme;
};

CPresentation.prototype.Get_ColorMap = function () {
    return AscFormat.G_O_DEFAULT_COLOR_MAP;
};

CPresentation.prototype.Get_PageFields = function () {
    return {X: 0, Y: 0, XLimit: 2000, YLimit: 2000};
};

CPresentation.prototype.Get_PageLimits = function (PageIndex) {
    return this.Get_PageFields();
};

CPresentation.prototype.CheckRange = function () {
    return [];
};

CPresentation.prototype.GetCursorRealPosition = function () {
    return {
        X: this.CurPosition.X,
        Y: this.CurPosition.Y
    };
};

CPresentation.prototype.Viewer_OnChangePosition = function () {
    var oSlide = this.Slides[this.CurPage];
    if (oSlide && oSlide.slideComments && Array.isArray(oSlide.slideComments.comments)) {
        var aComments = oSlide.slideComments.comments;
        for (var i = aComments.length - 1; i > -1; --i) {
            if (aComments[i].selected) {
                var Coords = this.DrawingDocument.ConvertCoordsToCursorWR_Comment(aComments[i].x, aComments[i].y);
                this.Api.sync_UpdateCommentPosition(aComments[i].Get_Id(), Coords.X, Coords.Y);
                break;
            }
        }
    }
    AscCommon.g_specialPasteHelper.SpecialPasteButton_Update_Position();
};

CPresentation.prototype.IsCell = function (isReturnCell) {
    if (isReturnCell)
        return null;

    return false;
};

CPresentation.prototype.GetPrevElementEndInfo = function (CurElement) {
    return null;
};
CPresentation.prototype.Get_TextBackGroundColor = function () {
    return new CDocumentColor(255, 255, 255, false);
};


CPresentation.prototype.SetTableProps = function (Props) {

    var oController = this.GetCurrentController();
    if (oController) {
        oController.setTableProps(Props);
        this.Recalculate();

        if (!this.FocusOnNotes) {
            var aConnectors = oController.getConnectorsForCheck();
            for (var i = 0; i < aConnectors.length; ++i) {
                aConnectors[i].calculateTransform(false);
                var oGroup = aConnectors[i].getMainGroup();
                if (oGroup) {
                    AscFormat.checkObjectInArray([], oGroup);
                }
            }
            if (aConnectors.length > 0) {
                this.Recalculate();
            }
        }

        this.Document_UpdateInterfaceState();
        this.Document_UpdateSelectionState();
    }
};

CPresentation.prototype.GetCalculatedParaPr = function () {
    var oController = this.GetCurrentController();
    if (oController) {
        var ret = oController.getParagraphParaPr();
        if (ret) {
            return ret;
        }
    }
    return new CParaPr();
};

CPresentation.prototype.GetCalculatedTextPr = function () {
    var oController = this.GetCurrentController();
    if (oController) {
        var ret = oController.getParagraphTextPr();
        if (ret) {
            var oTheme = oController.getTheme();
            if (oTheme) {
                ret.ReplaceThemeFonts(oTheme.themeElements.fontScheme);
            }
            return ret;
        }
    }
    return new CTextPr();
};

CPresentation.prototype.GetDirectTextPr = function () {
    var oController = this.GetCurrentController();
    if (oController) {
        return oController.getParagraphTextPr();
    }
    return new CTextPr();
};

CPresentation.prototype.GetDirectParaPr = function () {
    var oController = this.GetCurrentController();
    if (oController) {
        return oController.getParagraphParaPr();
    }
    return new CParaPr();
};


CPresentation.prototype.GetTableStyleIdMap = function (oMap) {
    var oSlide;
    var oObjectsMap = {};
    for (var i = 0; i < this.Slides.length; ++i) {
        oSlide = this.Slides[i];
        this.CollectStyleId(oMap, oSlide.cSld.spTree);
        if (oSlide.notes) {
            this.CollectStyleId(oMap, oSlide.notes.cSld.spTree);
        }
        if (oSlide.Layout) {
            if (!oObjectsMap[oSlide.Layout.Id]) {
                this.CollectStyleId(oMap, oSlide.Layout.cSld.spTree);
                oObjectsMap[oSlide.Layout.Id] = true;
            }
            if (oSlide.Layout.Master) {
                if (!oObjectsMap[oSlide.Layout.Master.Id]) {
                    this.CollectStyleId(oMap, oSlide.Layout.Master.cSld.spTree);
                    oObjectsMap[oSlide.Layout.Master.Id] = true;
                }
            }
        }
    }
};

CPresentation.prototype.CollectStyleId = function (oMap, aSpTree) {
    for (var i = 0; i < aSpTree.length; ++i) {
        if (aSpTree[i].getObjectType() === AscDFH.historyitem_type_GraphicFrame) {
            if (isRealObject(aSpTree[i].graphicObject) && typeof aSpTree[i].graphicObject.TableStyle === "string" && isRealObject(g_oTableId.Get_ById(aSpTree[i].graphicObject.TableStyle))) {
                var oStyle = AscCommon.g_oTableId.Get_ById(aSpTree[i].graphicObject.TableStyle);
                if (oStyle instanceof CStyle) {
                    oMap[aSpTree[i].graphicObject.TableStyle] = true;
                }
            }
        } else if (aSpTree[i].getObjectType() === AscDFH.historyitem_type_GroupShape) {
            this.CollectStyleId(oMap, aSpTree[i].spTree);
        }
    }
};

// Обновляем данные в интерфейсе о свойствах параграфа
CPresentation.prototype.Interface_Update_ParaPr = function () {
    var oController = this.GetCurrentController();
    if (oController) {
        var ParaPr = oController.getPropsArrays().paraPr;

        if (null != ParaPr) {
            if (undefined != ParaPr.Tabs) {
                var DefaultTab = ParaPr.DefaultTab != null ? ParaPr.DefaultTab : AscCommonWord.Default_Tab_Stop;
                editor.Update_ParaTab(DefaultTab, ParaPr.Tabs);
            }

            editor.UpdateParagraphProp(ParaPr);
        }
    }
};

// Обновляем данные в интерфейсе о свойствах текста
CPresentation.prototype.Interface_Update_TextPr = function () {
    var oController = this.GetCurrentController();
    if (oController) {
        var TextPr = oController.getPropsArrays().textPr;

        if (null != TextPr)
            editor.UpdateTextPr(TextPr);
    }
};


CPresentation.prototype.getAllTableStyles = function () {
    for (var i = 0; i < this.globalTableStyles.length; ++i) {
        this.globalTableStyles[i].stylesId = i;
    }
    return this.globalTableStyles;
};

CPresentation.prototype.IsVisibleSlide = function (nIndex) {
    var oSlide = this.Slides[nIndex];
    if (!oSlide) {
        return false;
    }
    return oSlide.isVisible();
};


CPresentation.prototype.hideSlides = function (isHide, aSlides) {

    var aSelectedArray;
    if (Array.isArray(aSlides)) {
        aSelectedArray = aSlides;
    } else {
        aSelectedArray = this.GetSelectedSlides();
    }
    if (false === this.Document_Is_SelectionLocked(AscCommon.changestype_SlideHide, aSelectedArray)) {
        History.Create_NewPoint(AscDFH.historydescription_Presentation_HideSlides);
        var bShow = !isHide;
        var oSlide;
        var nIndex;
        for (var i = 0; i < aSelectedArray.length; ++i) {
            nIndex = aSelectedArray[i];
            oSlide = this.Slides[nIndex];
            if (oSlide) {
                oSlide.setShow(bShow);
                this.DrawingDocument.OnRecalculatePage(nIndex, oSlide);//need only for update index label in thumbnails; TODO: remove it
            }
        }
        this.DrawingDocument.OnEndRecalculate(false, false);
        this.Document_UpdateUndoRedoState();
    }
};


CPresentation.prototype.SelectAll = function () {

    var oController = this.GetCurrentController();
    if (oController) {
        oController.selectAll();
        this.Document_UpdateInterfaceState();
    }
};


CPresentation.prototype.UpdateCursorType = function (X, Y, MouseEvent) {

    var oController = this.GetCurrentController();
    if (oController) {
        var graphicObjectInfo = oController.isPointInDrawingObjects(X, Y, MouseEvent);
        if (graphicObjectInfo) {
            if (!graphicObjectInfo.updated) {
                this.DrawingDocument.SetCursorType(graphicObjectInfo.cursorType);
            }
        } else {
            this.DrawingDocument.SetCursorType("default");
        }
        AscCommon.CollaborativeEditing.Check_ForeignCursorsLabels(X, Y, this.CurPage);
    }
};


CPresentation.prototype.OnKeyDown = function (e) {
    var bUpdateSelection = true;
    var bRetValue = keydownresult_PreventNothing;

    // Сбрасываем текущий элемент в поиске
    if (this.SearchEngine.Count > 0)
        this.SearchEngine.Reset_Current();

    var oController = this.GetCurrentController();
    if (e.KeyCode == 8) // BackSpace
    {
        if (this.CanEdit()) {
            this.Remove(-1, true, undefined, undefined, e.CtrlKey);
        }
        bRetValue = keydownresult_PreventAll;
    } else if (e.KeyCode == 9) // Tab
    {
        if (this.CanEdit()) {
            if (oController) {
                var graphicObjects = oController;
                var target_content = graphicObjects.getTargetDocContent(undefined, true);
                if (target_content) {
                    if (target_content instanceof CTable) {
                        target_content.MoveCursorToCell(true === e.ShiftKey ? false : true);
                    } else {
                        if (true === this.CollaborativeEditing.Is_Fast() || editor.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Drawing_Props) === false) {
                            if (target_content.Selection.StartPos === target_content.Selection.EndPos &&
                                target_content.Content[target_content.CurPos.ContentPos].IsCursorAtBegin() &&
                                target_content.Content[target_content.CurPos.ContentPos].CompiledPr.Pr &&
                                target_content.Content[target_content.CurPos.ContentPos].CompiledPr.Pr.ParaPr.Bullet &&
                                target_content.Content[target_content.CurPos.ContentPos].CompiledPr.Pr.ParaPr.Bullet.isBullet() &&
                                target_content.Content[target_content.CurPos.ContentPos].CompiledPr.Pr.ParaPr.Bullet.bulletType.type !== AscFormat.BULLET_TYPE_BULLET_NONE) {
                                if (this.Can_IncreaseParagraphLevel(!e.ShiftKey)) {
                                    this.IncreaseDecreaseIndent(!e.ShiftKey);
                                }
                            } else {
                                History.Create_NewPoint(AscDFH.historydescription_Presentation_ParagraphAdd);
                                this.AddToParagraph(new ParaTab());
                            }


                        }
                    }
                } else {
                    graphicObjects.selectNextObject(!e.ShiftKey ? 1 : -1);
                }
                this.Document_UpdateInterfaceState();
            }
        }
        bRetValue = keydownresult_PreventAll;
    } else if (e.KeyCode == 13) // Enter
    {
        var Hyperlink = this.IsCursorInHyperlink(false);
        if (null != Hyperlink && false === e.ShiftKey) {
            editor.sync_HyperlinkClickCallback(Hyperlink.GetValue());
            Hyperlink.SetVisited(true);

            // TODO: Пока сделаем так, потом надо будет переделать
            this.DrawingDocument.ClearCachePages();
            this.DrawingDocument.FirePaint();
        } else {
            if (e.CtrlKey) {
                if (oController) {
                    var bChangeSelect = false;
                    if (!this.FocusOnNotes) {
                        var aDrawings = oController.getDrawingArray();
                        for (var i = aDrawings.length - 1; i > -1; --i) {
                            if (aDrawings[i].selected) {
                                break;
                            }
                        }
                        ++i;
                        for (; i < aDrawings.length; ++i) {
                            if (aDrawings[i].getObjectType() === AscDFH.historyitem_type_Shape && aDrawings[i].isPlaceholder()) {
                                var oContent = aDrawings[i].getDocContent();
                                if (oContent) {
                                    oContent.Set_CurrentElement(0, false);
                                    bChangeSelect = true;
                                    if (!oContent.IsEmpty()) {
                                        oContent.SelectAll();
                                    }
                                    this.DrawingDocument.OnRecalculatePage(this.CurPage, this.Slides[this.CurPage]);
                                    this.Document_UpdateSelectionState();
                                    break;
                                }
                            }
                        }
                    }
                    if (this.CanEdit()) {
                        if (!bChangeSelect) {
                            History.Create_NewPoint(AscDFH.historydescription_Presentation_ParagraphAdd);
                            this.addNextSlide();
                        }
                    }
                }
            } else {
                if (oController) {
                    var oTargetDocContent = oController.getTargetDocContent();
                    if (oTargetDocContent) {
                        if (e.ShiftKey) {
                            if (oController.selectedObjects.length !== 0) {
                                if (true === this.CollaborativeEditing.Is_Fast() || this.Document_Is_SelectionLocked(changestype_Drawing_Props) === false) {
                                    History.Create_NewPoint(AscDFH.historydescription_Presentation_ParagraphAdd);

                                    var oSelectedInfo = new CSelectedElementsInfo();
                                    oTargetDocContent.GetSelectedElementsInfo(oSelectedInfo);
                                    var oMath = oSelectedInfo.Get_Math();
                                    if (null !== oMath && oMath.Is_InInnerContent()) {
                                        if (oMath.Handle_AddNewLine())
                                            this.Recalculate();
                                    } else {
                                        this.AddToParagraph(new ParaNewLine(break_Line));
                                    }
                                }
                            }
                        } else {
                            if (oController.selectedObjects.length !== 0) {
                                var aSelectedObjects = oController.selectedObjects;
                                if (aSelectedObjects.length === 1 && aSelectedObjects[0].isPlaceholder && aSelectedObjects[0].isPlaceholder()
                                    && aSelectedObjects[0].getPlaceholderType && (aSelectedObjects[0].getPlaceholderType() === AscFormat.phType_ctrTitle || aSelectedObjects[0].getPlaceholderType() === AscFormat.phType_title)) {
                                    if (true === this.CollaborativeEditing.Is_Fast() || this.Document_Is_SelectionLocked(changestype_Drawing_Props) === false) {
                                        History.Create_NewPoint(AscDFH.historydescription_Presentation_ParagraphAdd);
                                        var oSelectedInfo = new CSelectedElementsInfo();
                                        oTargetDocContent.GetSelectedElementsInfo(oSelectedInfo);
                                        var oMath = oSelectedInfo.Get_Math();
                                        if (null !== oMath && oMath.Is_InInnerContent()) {
                                            if (oMath.Handle_AddNewLine())
                                                this.Recalculate();
                                        } else {
                                            this.AddToParagraph(new ParaNewLine(break_Line));
                                        }
                                    }
                                } else {

                                    var oSelectedInfo = new CSelectedElementsInfo();
                                    oTargetDocContent.GetSelectedElementsInfo(oSelectedInfo);
                                    var oMath = oSelectedInfo.Get_Math();
                                    if (null !== oMath && oMath.Is_InInnerContent()) {
                                        if (true === this.CollaborativeEditing.Is_Fast() || this.Document_Is_SelectionLocked(changestype_Drawing_Props) === false) {
                                            History.Create_NewPoint(AscDFH.historydescription_Presentation_ParagraphAdd);
                                            if (oMath.Handle_AddNewLine())
                                                this.Recalculate();
                                        }
                                    } else {
                                        this.AddNewParagraph();

                                    }
                                }


                            }
                        }
                    } else {
                        var nRet = oController.handleEnter();
                        if (nRet & 2) {
                            if (this.Slides[this.CurPage]) {
                                this.DrawingDocument.OnRecalculatePage(this.CurPage, this.Slides[this.CurPage]);
                            }
                        }
                        if (nRet & 1) {
                            this.Document_UpdateSelectionState();
                            this.Document_UpdateInterfaceState();
                            this.Document_UpdateRulersState();
                        }
                    }
                }
            }
        }

        bRetValue = keydownresult_PreventAll;
    } else if (e.KeyCode == 27) // Esc
    {
        if (oController && !this.FocusOnNotes) {
            var oDrawingObjects = oController;
            if (oDrawingObjects.curState instanceof AscFormat.StartAddNewShape
                || oDrawingObjects.curState instanceof AscFormat.SplineBezierState
                || oDrawingObjects.curState instanceof AscFormat.PolyLineAddState
                || oDrawingObjects.curState instanceof AscFormat.AddPolyLine2State
                || oDrawingObjects.arrTrackObjects.length > 0) {
                editor.sync_EndAddShape();
                oDrawingObjects.changeCurrentState(new AscFormat.NullState(oDrawingObjects));
                if (oDrawingObjects.arrTrackObjects.length > 0) {
                    oDrawingObjects.clearTrackObjects();
                    oDrawingObjects.updateOverlay();
                }
                this.UpdateCursorType(0, 0, new AscCommon.CMouseEventHandler());
                return;
            }
            var oTargetTextObject = AscFormat.getTargetTextObject(oDrawingObjects);

            var bNeedRedraw;
            if (oTargetTextObject && oTargetTextObject.isEmptyPlaceholder()) {
                bNeedRedraw = true;
            } else {
                bNeedRedraw = false;
            }
            var bChart = oDrawingObjects.checkChartTextSelection(true);
            if (!bNeedRedraw) {
                bNeedRedraw = bChart;
            }
            if (e.ShiftKey || (!oDrawingObjects.selection.groupSelection && !oDrawingObjects.selection.textSelection && !oDrawingObjects.selection.chartSelection)) {
                oDrawingObjects.resetSelection();
            } else {
                if (oDrawingObjects.selection.groupSelection) {
                    var oGroupSelection = oDrawingObjects.selection.groupSelection.selection;
                    if (oGroupSelection.textSelection) {
                        if (oGroupSelection.textSelection.getObjectType() === AscDFH.historyitem_type_GraphicFrame) {
                            if (oGroupSelection.textSelection.graphicObject) {
                                oGroupSelection.textSelection.graphicObject.RemoveSelection();
                            }
                        } else {
                            var content = oGroupSelection.textSelection.getDocContent();
                            content && content.RemoveSelection();
                        }
                        oGroupSelection.textSelection = null;
                    } else if (oGroupSelection.chartSelection) {
                        oGroupSelection.chartSelection.resetSelection(false);
                        oGroupSelection.chartSelection = null;
                    } else {
                        oDrawingObjects.selection.groupSelection.resetSelection(this);
                        oDrawingObjects.selection.groupSelection = null;
                    }
                } else if (oDrawingObjects.selection.textSelection) {
                    if (oDrawingObjects.selection.textSelection.getObjectType() === AscDFH.historyitem_type_GraphicFrame) {
                        if (oDrawingObjects.selection.textSelection.graphicObject) {
                            oDrawingObjects.selection.textSelection.graphicObject.RemoveSelection();
                        }
                    } else {
                        var content = oDrawingObjects.selection.textSelection.getDocContent();
                        content && content.RemoveSelection();
                    }
                    oDrawingObjects.selection.textSelection = null;
                } else if (oDrawingObjects.selection.chartSelection) {
                    oDrawingObjects.selection.chartSelection.resetSelection(false);
                    oDrawingObjects.selection.chartSelection = null;
                }
            }
            if (bNeedRedraw) {
                this.DrawingDocument.OnRecalculatePage(this.CurPage, this.Slides[this.CurPage]);
            }
            this.Document_UpdateSelectionState();
            this.Document_UpdateInterfaceState();
        }
        if (true === this.DrawingDocument.IsTrackText()) {
            this.DrawingDocument.CancelTrackText();
        }
        if (AscCommon.c_oAscFormatPainterState.kOff !== this.Api.isPaintFormat) {
            this.Api.sync_PaintFormatCallback(AscCommon.c_oAscFormatPainterState.kOff);
            this.OnMouseMove(global_mouseEvent, 0, 0, this.CurPage);
        }
        bRetValue = keydownresult_PreventAll;
    } else if (e.KeyCode == 33) // PgUp
    {
        if (true === e.AltKey) {
        } else {
            if (this.CurPage > 0) {
                this.DrawingDocument.m_oWordControl.GoToPage(this.CurPage - 1);
            }
        }
        bRetValue = keydownresult_PreventAll;
    } else if (e.KeyCode == 34) // PgDn
    {
        if (true === e.AltKey) {
        } else {
            if (this.CurPage + 1 < this.Slides.length) {
                this.DrawingDocument.m_oWordControl.GoToPage(this.CurPage + 1);
            }
        }
        bRetValue = keydownresult_PreventAll;
    } else if (e.KeyCode == 35) // клавиша End
    {
        if (oController.getTargetDocContent()) {
            if (true === e.CtrlKey) // Ctrl + End - переход в конец документа
            {
                this.MoveCursorToEndPos();
            } else // Переходим в конец строки
            {
                this.MoveCursorToEndOfLine(true === e.ShiftKey);
            }
        } else {
            if (!e.ShiftKey) {
                if (this.CurPage !== (this.Slides.length - 1)) {
                    editor.WordControl.GoToPage(this.Slides.length - 1);
                }
            } else {
                if (this.Slides.length > 0) {
                    editor.WordControl.Thumbnails && editor.WordControl.Thumbnails.CorrectShiftSelect(false, true);
                }
            }
        }

        bRetValue = keydownresult_PreventAll;
    } else if (e.KeyCode == 36) // клавиша Home
    {
        if (oController.getTargetDocContent()) {
            if (true === e.CtrlKey) // Ctrl + Home - переход в начало документа
            {
                this.MoveCursorToStartPos();
            } else // Переходим в начало строки
            {
                this.MoveCursorToStartOfLine(true === e.ShiftKey);
            }
        } else {
            if (!e.ShiftKey) {
                if (this.Slides.length > 0) {
                    editor.WordControl.GoToPage(0);
                }
            } else {
                if (this.Slides.length > 0) {
                    editor.WordControl.Thumbnails && editor.WordControl.Thumbnails.CorrectShiftSelect(true, true);
                }
            }
        }
        bRetValue = keydownresult_PreventAll;
    } else if (e.KeyCode == 37) // Left Arrow
    {
        this.MoveCursorLeft(true === e.ShiftKey, true === e.CtrlKey);
        bRetValue = keydownresult_PreventAll;
    } else if (e.KeyCode == 38) // Top Arrow
    {
        this.MoveCursorUp(true === e.ShiftKey, true === e.CtrlKey);
        bRetValue = keydownresult_PreventAll;
    } else if (e.KeyCode == 39) // Right Arrow
    {
        // Чтобы при зажатой клавише курсор не пропадал
        // if ( true != e.ShiftKey )
        //     this.DrawingDocument.TargetStart();

        this.MoveCursorRight(true === e.ShiftKey, true === e.CtrlKey);
        bRetValue = keydownresult_PreventAll;
    } else if (e.KeyCode == 40) // Bottom Arrow
    {
        // Чтобы при зажатой клавише курсор не пропадал
        //if ( true != e.ShiftKey )
        //    this.DrawingDocument.TargetStart();

        this.MoveCursorDown(true === e.ShiftKey, true === e.CtrlKey);
        bRetValue = keydownresult_PreventAll;
    } else if (e.KeyCode == 46) // Delete
    {
        if (true != e.ShiftKey) {
            if (this.CanEdit()) {
                //this.Create_NewHistoryPoint();
                this.Remove(1, true, undefined, undefined, e.CtrlKey);
            }
            bRetValue = keydownresult_PreventAll;
        }
    } else if (e.KeyCode == 49 && true === e.AltKey && !e.AltGr) // Alt + Ctrl + Num1 - применяем стиль Heading1
    {
        bRetValue = keydownresult_PreventAll;
    } else if (e.KeyCode == 50 && true === e.AltKey && !e.AltGr) // Alt + Ctrl + Num2 - применяем стиль Heading2
    {
        bRetValue = keydownresult_PreventAll;
    } else if (e.KeyCode == 51 && true === e.AltKey && !e.AltGr) // Alt + Ctrl + Num3 - применяем стиль Heading3
    {
        bRetValue = keydownresult_PreventAll;
    } else if (e.KeyCode == 56 && true === e.CtrlKey && true === e.ShiftKey) // Ctrl + Shift + 8 - showParaMarks
    {
        editor.ShowParaMarks = !editor.ShowParaMarks;
        if (this.Slides[this.CurPage]) {
            this.DrawingDocument.OnRecalculatePage(this.CurPage, this.Slides[this.CurPage]);
            if (this.Slides[this.CurPage].notes) {
                this.DrawingDocument.Notes_OnRecalculate(this.CurPage, this.Slides[this.CurPage].NotesWidth, this.Slides[this.CurPage].getNotesHeight());
            }
        }
        bRetValue = keydownresult_PreventAll;
    } else if (e.KeyCode == 65 && true === e.CtrlKey) // Ctrl + A - выделяем все
    {
        this.SelectAll();
        bRetValue = keydownresult_PreventAll;
    } else if (e.KeyCode == 66 && true === e.CtrlKey) // Ctrl + B - делаем текст жирным
    {
        var TextPr = this.GetCalculatedTextPr();
        if (null != TextPr && this.CanEdit()) {
            if (this.Document_Is_SelectionLocked(changestype_Drawing_Props) === false) {
                History.Create_NewPoint(AscDFH.historydescription_Presentation_ParagraphAdd);
                this.AddToParagraph(new ParaTextPr({Bold: TextPr.Bold === true ? false : true}));
            }
            bRetValue = keydownresult_PreventAll;
        }
    } else if (e.KeyCode == 67 && true === e.CtrlKey) // Ctrl + C + ...
    {
        if (true === e.ShiftKey) // Ctrl + Shift + C - копирование форматирования текста
        {
            this.Document_Format_Copy();
            bRetValue = keydownresult_PreventAll;
        }
    } else if (e.KeyCode == 68 && true === e.CtrlKey) {
        if (this.CanEdit()) {
            if (oController) {
                if (oController.selectedObjects.length > 0) {
                    this.Create_NewHistoryPoint(AscDFH.historydescription_Document_SetParagraphAlignHotKey);
                    this.Slides[this.CurPage].copySelectedObjects();
                    this.Recalculate();
                    this.Document_UpdateInterfaceState();
                } else {
                    this.DublicateSlide();
                }
            }
        }
        bRetValue = keydownresult_PreventAll;
    } else if (e.KeyCode == 69 && true === e.CtrlKey) {
        if (this.CanEdit()) {
            if (true !== e.AltKey) // Ctrl + E - переключение прилегания параграфа между center и left
            {
                var ParaPr = this.GetCalculatedParaPr();
                if (null != ParaPr && ParaPr.Jc !== AscCommon.align_Center) {
                    this.Create_NewHistoryPoint(AscDFH.historydescription_Document_SetParagraphAlignHotKey);
                    this.SetParagraphAlign(AscCommon.align_Center);
                    this.Document_UpdateInterfaceState();
                }
            } else // Ctrl + Alt + E - добавляем знак евро €
            {
                if (true === this.CollaborativeEditing.Is_Fast() || this.Document_Is_SelectionLocked(changestype_Drawing_Props) === false) {
                    History.Create_NewPoint(AscDFH.historydescription_Presentation_ParagraphAdd);
                    this.AddToParagraph(new ParaText("€".charCodeAt(0)));
                }
            }
        }
        bRetValue = keydownresult_PreventAll;
    } else if (e.KeyCode == 71 && true === e.CtrlKey) // Ctrl + G - группируем объекты
    {
        if (this.CanEdit()) {
            if (true === e.ShiftKey) {
                this.unGroupShapes();
            } else {
                this.groupShapes();
            }
        }
        bRetValue = keydownresult_PreventAll;
    } else if (e.KeyCode == 73 && true === e.CtrlKey) // Ctrl + I - делаем текст наклонным
    {
        var TextPr = this.GetCalculatedTextPr();
        if (null != TextPr) {
            if (this.CanEdit() && this.Document_Is_SelectionLocked(changestype_Drawing_Props) === false) {
                History.Create_NewPoint(AscDFH.historydescription_Presentation_ParagraphAdd);
                this.AddToParagraph(new ParaTextPr({Italic: TextPr.Italic === true ? false : true}));
            }
            bRetValue = keydownresult_PreventAll;
        }
    } else if (e.KeyCode == 74 && true === e.CtrlKey) // Ctrl + J переключение прилегания параграфа между justify и left
    {
        var ParaPr = this.GetCalculatedParaPr();
        if (null != ParaPr && this.CanEdit() && ParaPr.Jc !== align_Justify) {
            this.SetParagraphAlign(align_Justify);
        }
        bRetValue = keydownresult_PreventAll;
    } else if (e.KeyCode == 75 && true === e.CtrlKey) // Ctrl + K - добавление гиперссылки
    {
        if (this.CanEdit() && true === this.CanAddHyperlink(false))
            editor.sync_DialogAddHyperlink();

        bRetValue = keydownresult_PreventAll;
    } else if (e.KeyCode == 76 && true === e.CtrlKey) // Ctrl + L + ...
    {
        if (true === e.ShiftKey) // Ctrl + Shift + L - добавляем список к данному параграфу
        {
            if (this.CanEdit()) {
                this.SetParagraphNumbering({Type: 0, SubType: 1});
            }
            bRetValue = keydownresult_PreventAll;
        } else // Ctrl + L - переключение прилегания параграфа между left и justify
        {
            var ParaPr = this.GetCalculatedParaPr();
            if (null != ParaPr) {
                if (this.CanEdit() && ParaPr.Jc !== align_Left) {
                    this.SetParagraphAlign(align_Left);
                }
                bRetValue = keydownresult_PreventAll;
            }
        }
    } else if (e.KeyCode == 77 && true === e.CtrlKey) // Ctrl + M + ...
    {
        if (this.CanEdit()) {
            if (oController && oController.getTargetDocContent()) {
                if (true === e.ShiftKey) // Ctrl + Shift + M - уменьшаем левый отступ
                    editor.DecreaseIndent();
                else // Ctrl + M - увеличиваем левый отступ
                    editor.IncreaseIndent();
            } else {
                if (editor.WordControl.Thumbnails) {
                    var _selected_thumbnails = this.GetSelectedSlides();
                    if (_selected_thumbnails.length > 0) {
                        var _last_selected_slide_num = _selected_thumbnails[_selected_thumbnails.length - 1];
                        editor.WordControl.GoToPage(_last_selected_slide_num);
                        editor.WordControl.m_oLogicDocument.addNextSlide();
                    }
                    else if(this.Slides.length === 0) {
                        editor.WordControl.m_oLogicDocument.addNextSlide();
                        editor.WordControl.GoToPage(0);
                    }
                }
            }
        }
        bRetValue = keydownresult_PreventAll;
    } else if (e.KeyCode == 80 && true === e.CtrlKey) // Ctrl + P + ...
    {
        if (true === e.ShiftKey && this.CanEdit()) // Ctrl + Shift + P - добавляем номер страницы в текущую позицию
        {
            bRetValue = keydownresult_PreventAll;
        } else // Ctrl + P - print
        {
            this.DrawingDocument.m_oWordControl.m_oApi.onPrint();
            bRetValue = keydownresult_PreventAll;
        }
    } else if (e.KeyCode == 82 && true === e.CtrlKey) // Ctrl + R - переключение прилегания параграфа между right и left
    {
        var ParaPr = this.GetCalculatedParaPr();
        if (null != ParaPr) {
            if (this.CanEdit() && ParaPr.Jc !== AscCommon.align_Right) {
                this.SetParagraphAlign(AscCommon.align_Right);
            }
            bRetValue = keydownresult_PreventAll;
        }
    } else if (e.KeyCode == 83 && true === e.CtrlKey) // Ctrl + S - save
    {
        if (this.CanEdit()) {
            this.DrawingDocument.m_oWordControl.m_oApi.asc_Save(false);
        }
        bRetValue = keydownresult_PreventAll;
    } else if (e.KeyCode == 85 && true === e.CtrlKey) // Ctrl + U - делаем текст подчеркнутым
    {
        var TextPr = this.GetCalculatedTextPr();
        if (null != TextPr) {
            if (this.CanEdit() && this.Document_Is_SelectionLocked(changestype_Drawing_Props) === false) {
                History.Create_NewPoint(AscDFH.historydescription_Presentation_ParagraphAdd);
                this.AddToParagraph(new ParaTextPr({Underline: TextPr.Underline === true ? false : true}));
            }
            bRetValue = keydownresult_PreventAll;
        }
    } else if (e.KeyCode == 53 && true === e.CtrlKey) // Ctrl + 5 - делаем текст зачеркнутым
    {
        var TextPr = this.GetCalculatedTextPr();
        if (null != TextPr) {
            if (this.CanEdit() && this.Document_Is_SelectionLocked(changestype_Drawing_Props) === false) {
                History.Create_NewPoint(AscDFH.historydescription_Presentation_ParagraphAdd);
                this.AddToParagraph(new ParaTextPr({Strikeout: TextPr.Strikeout === true ? false : true}));
            }
            bRetValue = keydownresult_PreventAll;
        }
    } else if (e.KeyCode == 86 && true === e.CtrlKey) // Ctrl + V - paste
    {
        if (true === e.ShiftKey) // Ctrl + Shift + V - вставляем по образцу
        {
            if (this.CanEdit()) {
                this.Document_Format_Paste();
            }
            bRetValue = keydownresult_PreventAll;
        }
    } else if (e.KeyCode == 89 && true === e.CtrlKey) // Ctrl + Y - Redo
    {
        if (this.CanEdit() || this.IsEditCommentsMode()) {
            this.Document_Redo();
        }

        bRetValue = keydownresult_PreventAll;
    } else if (e.KeyCode == 90 && true === e.CtrlKey) // Ctrl + Z - Undo
    {
        if (this.CanEdit() || this.IsEditCommentsMode()) {
            this.Document_Undo();
        }
        bRetValue = keydownresult_PreventAll;
    } else if ((AscCommon.AscBrowser.isOpera && (e.KeyCode == 93 || 57351 == e.KeyCode /*в Opera такой код*/)) || (e.KeyCode == 121 && true === e.ShiftKey /*shift + f10*/)) // контекстное меню
    {
        if (this.GetFocusObjType() === FOCUS_OBJECT_MAIN) {
            if (oController) {
                var oPosition = oController.getContextMenuPosition(0);
                var ConvertedPos = this.DrawingDocument.ConvertCoordsToCursorWR(oPosition.X, oPosition.Y, this.PageNum);
                editor.sync_ContextMenuCallback(new AscCommonSlide.CContextMenuData({
                    Type: Asc.c_oAscContextMenuTypes.Main,
                    X_abs: ConvertedPos.X,
                    Y_abs: ConvertedPos.Y
                }));
            }
        }

        bUpdateSelection = false;
        bRetValue = keydownresult_PreventAll;
    } else if (e.KeyCode == 144) // Num Lock
    {
        // Ничего не делаем
        bRetValue = keydownresult_PreventAll;
    } else if (e.KeyCode == 145) // Scroll Lock
    {
        // Ничего не делаем
        bRetValue = keydownresult_PreventAll;
    } else if (e.KeyCode == 187 && true === e.CtrlKey) // Ctrl + Shift + +, Ctrl + = - superscript/subscript
    {
        var TextPr = this.GetCalculatedTextPr();
        if (null != TextPr) {
            if (this.CanEdit() && this.Document_Is_SelectionLocked(changestype_Drawing_Props) === false) {
                History.Create_NewPoint(AscDFH.historydescription_Presentation_ParagraphAdd);
                if (true === e.ShiftKey)
                    this.AddToParagraph(new ParaTextPr({VertAlign: TextPr.VertAlign === AscCommon.vertalign_SuperScript ? vertalign_Baseline : AscCommon.vertalign_SuperScript}));
                else
                    this.AddToParagraph(new ParaTextPr({VertAlign: TextPr.VertAlign === AscCommon.vertalign_SubScript ? vertalign_Baseline : AscCommon.vertalign_SubScript}));
            }
            bRetValue = keydownresult_PreventAll;
        }
    } else if (e.KeyCode == 188 && true === e.CtrlKey) // Ctrl + ,
    {
        var TextPr = this.GetCalculatedTextPr();
        if (null != TextPr) {
            if (this.Document_Is_SelectionLocked(changestype_Drawing_Props) === false) {
                History.Create_NewPoint(AscDFH.historydescription_Presentation_ParagraphAdd);
                this.AddToParagraph(new ParaTextPr({VertAlign: TextPr.VertAlign === AscCommon.vertalign_SuperScript ? vertalign_Baseline : AscCommon.vertalign_SuperScript}));
            }
            bRetValue = keydownresult_PreventAll;
        }
    } else if (e.KeyCode == 189) // Клавиша Num-
    {
        if ((true === e.CtrlKey && true === e.ShiftKey) && (true === this.CollaborativeEditing.Is_Fast() || this.Document_Is_SelectionLocked(changestype_Drawing_Props) === false)) {
            if (this.CanEdit()) {
                this.DrawingDocument.TargetStart();
                this.DrawingDocument.TargetShow();

                History.Create_NewPoint(AscDFH.historydescription_Presentation_ParagraphAdd);

                var Item = new ParaText(0x2013);
                Item.SpaceAfter = false;

                this.AddToParagraph(Item);
            }
            bRetValue = keydownresult_PreventAll;
        }
    } else if (e.KeyCode == 190 && true === e.CtrlKey) // Ctrl + .
    {
        var TextPr = this.GetCalculatedTextPr();
        if (null != TextPr) {
            if (this.Document_Is_SelectionLocked(changestype_Drawing_Props) === false) {
                History.Create_NewPoint(AscDFH.historydescription_Presentation_ParagraphAdd);
                this.AddToParagraph(new ParaTextPr({VertAlign: TextPr.VertAlign === AscCommon.vertalign_SubScript ? vertalign_Baseline : AscCommon.vertalign_SubScript}));
            }
            bRetValue = keydownresult_PreventAll;
        }
    } else if (e.KeyCode == 219 && true === e.CtrlKey) // Ctrl + [
    {
        if (this.CanEdit()) {
            editor.FontSizeOut();
            this.Document_UpdateInterfaceState();
        }
        bRetValue = keydownresult_PreventAll;
    } else if (e.KeyCode == 221 && true === e.CtrlKey) // Ctrl + ]
    {
        if (this.CanEdit()) {
            editor.FontSizeIn();
            this.Document_UpdateInterfaceState();
        }
        bRetValue = keydownresult_PreventAll;
    }

    if (bRetValue & keydownflags_PreventKeyPress && true === bUpdateSelection)
        this.Document_UpdateSelectionState();

    return bRetValue;
};

CPresentation.prototype.Set_DocumentDefaultTab = function (DTab) {
    var oController = this.GetCurrentController();
    return oController && oController.setDefaultTabSize(DTab);
};

CPresentation.prototype.SetDocumentMargin = function () {

};

CPresentation.prototype.OnKeyPress = function (e) {
    if (!this.CanEdit())
        return false;

    var oCurSlide = this.Slides[this.CurPage];
    if (!oCurSlide || !oCurSlide.graphicObjects) {
        return;
    }
    if (!this.FocusOnNotes && oCurSlide.graphicObjects.selectedObjects.length === 0) {
        var oTitle = oCurSlide.getMatchingShape(AscFormat.phType_title, null);
        if (oTitle) {
            var oDocContent = oTitle.getDocContent();
            if (oDocContent.Is_Empty()) {
                oDocContent.Set_CurrentElement(0, false);
            } else {
                return;
            }
        } else {
            return;
        }
    }
    if (this.FocusOnNotes && !oCurSlide.notesShape) {
        return;
    }
    var Code;
    if (null != e.Which)
        Code = e.Which;
    else if (e.KeyCode)
        Code = e.KeyCode;
    else
        Code = 0;//special char

    var bRetValue = false;

    /*
         if ( 1105 == Code )
         {
         this.LoadTestDocument();
         return true;
         }
         else*/
    if (Code > 0x20) {
        if (true === this.CollaborativeEditing.Is_Fast() || this.Document_Is_SelectionLocked(changestype_Drawing_Props) === false) {
            History.Create_NewPoint(AscDFH.historydescription_Presentation_ParagraphAdd);
            //this.Create_NewHistoryPoint();

            //this.DrawingDocument.TargetStart();
            //this.DrawingDocument.TargetShow();
            var target_doc_content1, target_doc_content2, b_update_interface = false;
            var oController = this.GetCurrentController();
            if (oController) {
                target_doc_content1 = oController.getTargetDocContent();
            }
            this.CheckLanguageOnTextAdd = true;
            this.AddToParagraph(new ParaText(Code), false, true);
            this.CheckLanguageOnTextAdd = false;
            if (oController) {
                target_doc_content2 = oController.getTargetDocContent();
            }
            if (!target_doc_content1 && target_doc_content2) {
                b_update_interface = true;
                this.Document_UpdateInterfaceState();
                this.Document_UpdateRulersState();
            }
        }
        bRetValue = true;
    } else if (Code == 32) // Space
    {
        var oController = this.GetCurrentController();
        if (true === e.ShiftKey && true === e.CtrlKey) {
            this.DrawingDocument.TargetStart();
            this.DrawingDocument.TargetShow();


            if (true === this.CollaborativeEditing.Is_Fast() || this.Document_Is_SelectionLocked(changestype_Drawing_Props) === false) {
                if (oController && oController.selectedObjects.length !== 0) {
                    History.Create_NewPoint(AscDFH.historydescription_Presentation_ParagraphAdd);
                    this.AddToParagraph(new ParaText(0x00A0));
                }
            }
        } else if (true === e.CtrlKey) {
            this.ClearParagraphFormatting(false, true);
        } else {
            if (true === this.CollaborativeEditing.Is_Fast() || this.Document_Is_SelectionLocked(changestype_Drawing_Props) === false) {
                if (oController && oController.selectedObjects.length !== 0) {
                    History.Create_NewPoint(AscDFH.historydescription_Presentation_ParagraphAdd);
                    this.AddToParagraph(new ParaSpace());
                }
            }
        }
        bRetValue = true;
    }

    if (true == bRetValue) {
        this.Document_UpdateSelectionState();
        if (!b_update_interface) {
            this.Document_UpdateUndoRedoState();
            this.Document_UpdateRulersState();
        }
    }

    return bRetValue;
};


CPresentation.prototype.CheckEmptyPlaceholderNotes = function () {
    var oCurSlide = this.Slides[this.CurPage];
    this.DrawingDocument.CheckGuiControlColors();
    if (oCurSlide && oCurSlide.notesShape) {
        var oContent = oCurSlide.notesShape.getDocContent();
        if (oContent && oContent.Is_Empty()) {
            this.DrawingDocument.Notes_OnRecalculate(this.CurPage, this.Slides[this.CurPage].NotesWidth, this.Slides[this.CurPage].getNotesHeight());
            return true;
        }
    }
    return false;
};

CPresentation.prototype.OnMouseDown = function (e, X, Y, PageIndex) {

    this.CurPage = PageIndex;


    var _old_focus = this.FocusOnNotes;
    this.FocusOnNotes = false;
    if (PageIndex < 0)
        return;

    // Сбрасываем текущий элемент в поиске
    if (this.SearchEngine.Count > 0)
        this.SearchEngine.Reset_Current();

    this.CurPage = PageIndex;
    e.ctrlKey = e.CtrlKey;
    e.shiftKey = e.ShiftKey;
    var ret = this.Slides[this.CurPage].graphicObjects.onMouseDown(e, X, Y);
    this.private_UpdateCursorXY(true, true);
    if (!ret) {
        this.Document_UpdateSelectionState();
    }
    this.Document_UpdateInterfaceState();
    if (_old_focus) {
        this.CheckEmptyPlaceholderNotes();
    }
    if (ret) {
        return keydownresult_PreventAll;
    }
    return keydownresult_PreventNothing;
};

CPresentation.prototype.OnMouseUp = function (e, X, Y, PageIndex) {
    e.ctrlKey = e.CtrlKey;
    e.shiftKey = e.ShiftKey;
    var nStartPage = this.CurPage;

    var oController = this.Slides[this.CurPage] && this.Slides[this.CurPage].graphicObjects;
    if (oController) {
        oController.onMouseUp(e, X, Y);
        this.private_UpdateCursorXY(true, true);
    }
    if (nStartPage !== this.CurPage) {
        this.DrawingDocument.CheckTargetShow();
        this.Document_UpdateSelectionState();
    }
    if (e.Button === AscCommon.g_mouse_button_right && !this.noShowContextMenu) {
        var ContextData = new AscCommonSlide.CContextMenuData();
        var ConvertedPos = this.DrawingDocument.ConvertCoordsToCursorWR(X, Y, PageIndex);
        ContextData.X_abs = ConvertedPos.X;
        ContextData.Y_abs = ConvertedPos.Y;
        ContextData.IsSlideSelect = false;
        editor.sync_ContextMenuCallback(ContextData);
    }
    this.noShowContextMenu = false;
    this.Document_UpdateInterfaceState();
    this.Api.sendEvent("asc_onSelectionEnd");
    if (oController.isSlideShow()) {
        oController.handleEventMode = AscFormat.HANDLE_EVENT_MODE_CURSOR;
        var oResult = oController.curState.onMouseDown(e, X, Y, 0);
        oController.handleEventMode = AscFormat.HANDLE_EVENT_MODE_HANDLE;
        if (oResult) {
            return keydownresult_PreventAll;
        }
    }
    return keydownresult_PreventNothing;
};

CPresentation.prototype.OnMouseMove = function (e, X, Y, PageIndex) {
    e.ctrlKey = e.CtrlKey;
    e.shiftKey = e.ShiftKey;
    editor.sync_MouseMoveStartCallback();
    this.CurPage = PageIndex;
    var oController = this.Slides[this.CurPage] && this.Slides[this.CurPage].graphicObjects;
    if (oController) {
        oController.onMouseMove(e, X, Y);
    }
    var bOldFocus = this.FocusOnNotes;
    this.FocusOnNotes = false;
    this.UpdateCursorType(X, Y, e);
    this.FocusOnNotes = bOldFocus;
    editor.sync_MouseMoveEndCallback();
    if (oController.isSlideShow()) {
        oController.handleEventMode = AscFormat.HANDLE_EVENT_MODE_CURSOR;
        var oResult = oController.curState.onMouseDown(e, X, Y, 0);
        oController.handleEventMode = AscFormat.HANDLE_EVENT_MODE_HANDLE;
        if (oResult) {
            return keydownresult_PreventAll;
        }
    }
    return keydownresult_PreventNothing;
};

CPresentation.prototype.OnEndTextDrag = function (NearPos, bCopy) {
    var oController = this.GetCurrentController();
    if (!oController) {
        return;
    }

    var oContent = oController.getTargetDocContent();
    if (oContent && oContent.CheckPosInSelection(0, 0, 0, NearPos)) {
        var Paragraph = NearPos.Paragraph;
        Paragraph.Cursor_MoveToNearPos(NearPos);
        Paragraph.Document_SetThisElementCurrent(false);

        oController.onMouseUp(AscCommon.global_mouseEvent, AscCommon.global_mouseEvent.X, AscCommon.global_mouseEvent.Y);
        this.private_UpdateCursorXY(true, true);
        this.Document_UpdateSelectionState();
        this.Document_UpdateInterfaceState();
        this.Document_UpdateRulersState();
    } else {

        var oParagraph = NearPos.Paragraph;
        var bUndo = true;
        History.Create_NewPoint(AscDFH.historydescription_Document_DragText);

        var oSelectedContent = this.GetSelectedContent();
        var aCheckObjects = [];
        var aSelectedObjects, oObjectFrom, bIsLocked;
        if (oParagraph && oSelectedContent && oSelectedContent.DocContent) {
            if (oSelectedContent.DocContent) {
                if (oParagraph.Parent && oParagraph.Parent.Parent && oParagraph.Parent.Parent.parent) {
                    var oObjectTo = oParagraph.Parent.Parent.parent;
                    while (oObjectTo.group) {
                        oObjectTo = oObjectTo.group;
                    }
                    oObjectFrom = AscFormat.getTargetTextObject(oController);
                    if (oObjectFrom && oObjectFrom.getObjectType() === AscDFH.historyitem_type_Shape) {
                        while (oObjectFrom.group) {
                            oObjectFrom = oObjectFrom.group;
                        }
                        aCheckObjects.push(oObjectTo);
                        if (!bCopy) {
                            if (oObjectFrom !== oObjectTo) {
                                aCheckObjects.push(oObjectFrom);
                            }
                        }
                        aSelectedObjects = oController.selectedObjects;
                        oController.selectedObjects = [];
                        bIsLocked = this.Document_Is_SelectionLocked(changestype_Drawing_Props, aCheckObjects);

                        oController.selectedObjects = aSelectedObjects;
                        if (!bIsLocked) {

                            NearPos.Paragraph.Check_NearestPos(NearPos);
                            if (!bCopy) {
                                oController.removeCallback(-1, undefined, undefined, undefined, undefined, true);
                            }
                            oController.resetSelection(false, false);
                            oSelectedContent = oSelectedContent.copy();
                            oParagraph.Parent.InsertContent(oSelectedContent.DocContent, NearPos);
                            oController.onMouseUp(AscCommon.global_mouseEvent, AscCommon.global_mouseEvent.X, AscCommon.global_mouseEvent.Y);
                            NearPos.Paragraph.Document_SetThisElementCurrent(false);
                            this.Recalculate();
                            this.Document_UpdateSelectionState();
                            this.Document_UpdateUndoRedoState();
                            this.Document_UpdateInterfaceState();
                            this.Document_UpdateRulersState();
                            bUndo = false;
                        }
                    }
                }
            }
        } else {
            if (oSelectedContent.SlideObjects.length === 0 && oSelectedContent.DocContent) {
                oObjectFrom = AscFormat.getTargetTextObject(oController);
                if (oObjectFrom && oObjectFrom.getObjectType() === AscDFH.historyitem_type_Shape) {
                    while (oObjectFrom.group) {
                        oObjectFrom = oObjectFrom.group;
                    }
                    aCheckObjects.push(oObjectFrom);
                    aSelectedObjects = oController.selectedObjects;
                    oController.selectedObjects = [];
                    bIsLocked = this.Document_Is_SelectionLocked(changestype_Drawing_Props, aCheckObjects);

                    oController.selectedObjects = aSelectedObjects;

                    if (!bIsLocked) {
                        if (!bCopy) {
                            oController.removeCallback(-1, undefined, undefined, undefined, undefined, true);
                        }
                        this.Slides[this.CurPage].graphicObjects.resetSelection(undefined, false);
                        oSelectedContent = oSelectedContent.copy();
                        this.InsertContent(oSelectedContent);
                        var oShape = this.Slides[this.CurPage].graphicObjects.selectedObjects[0];
                        if (oShape) {
                            oShape.spPr.xfrm.setOffX(NearPos.X);
                            oShape.spPr.xfrm.setOffY(NearPos.Y);
                        }
                        this.Recalculate();
                        bUndo = false;
                        oController.onMouseUp(AscCommon.global_mouseEvent, AscCommon.global_mouseEvent.X, AscCommon.global_mouseEvent.Y);
                        this.Document_UpdateSelectionState();
                        this.Document_UpdateUndoRedoState();
                        this.Document_UpdateInterfaceState();
                        this.Document_UpdateRulersState();
                    }
                }
            }
        }
        if (bUndo) {
            History.Remove_LastPoint();
            if (oParagraph) {
                oParagraph.Clear_NearestPosArray();
            }
            oController.onMouseUp(AscCommon.global_mouseEvent, AscCommon.global_mouseEvent.X, AscCommon.global_mouseEvent.Y);
        }
    }
};

CPresentation.prototype.IsFocusOnNotes = function () {
    return this.FocusOnNotes;
};

CPresentation.prototype.Notes_OnMouseDown = function (e, X, Y) {
    // Сбрасываем текущий элемент в поиске
    if (this.SearchEngine.Count > 0)
        this.SearchEngine.Reset_Current();
    var bFocusOnSlide = !this.FocusOnNotes;
    this.FocusOnNotes = true;
    var oCurSlide = this.Slides[this.CurPage];
    var oDrawingObjects = oCurSlide.graphicObjects;
    if (oDrawingObjects.curState instanceof AscFormat.StartAddNewShape
        || oDrawingObjects.curState instanceof AscFormat.SplineBezierState
        || oDrawingObjects.curState instanceof AscFormat.PolyLineAddState
        || oDrawingObjects.curState instanceof AscFormat.AddPolyLine2State
        || oDrawingObjects.arrTrackObjects.length > 0) {
        oDrawingObjects.changeCurrentState(new AscFormat.NullState(oDrawingObjects));
        if (oDrawingObjects.arrTrackObjects.length > 0) {
            oDrawingObjects.clearTrackObjects();
            oDrawingObjects.updateOverlay();
        }
        this.Api.sync_EndAddShape();
        this.UpdateCursorType(0, 0, new AscCommon.CMouseEventHandler());
    }
    if (oCurSlide) {
        if (bFocusOnSlide) {
            var bNeedRedraw = false;
            if (AscFormat.checkEmptyPlaceholderContent(oCurSlide.graphicObjects.getTargetDocContent(false, false))) {
                bNeedRedraw = true;
            }
            oCurSlide.graphicObjects.resetSelection(true, false);
            var aComments = oCurSlide.slideComments && oCurSlide.slideComments.comments;
            if (Array.isArray(aComments)) {
                for (var i = 0; i < aComments.length; ++i) {
                    if (aComments[i].selected) {
                        bNeedRedraw = true;
                        aComments[i].selected = false;
                        editor.asc_hideComments();
                        break;
                    }
                }
            }
            oCurSlide.graphicObjects.clearPreTrackObjects();
            oCurSlide.graphicObjects.clearTrackObjects();
            oCurSlide.graphicObjects.changeCurrentState(new AscFormat.NullState(oCurSlide.graphicObjects));
            if (bNeedRedraw) {
                this.DrawingDocument.OnRecalculatePage(this.CurPage, oCurSlide);
                this.DrawingDocument.OnEndRecalculate();
            }

        }
        if (oCurSlide.notes) {
            e.ctrlKey = e.CtrlKey;
            e.shiftKey = e.ShiftKey;
            var ret = oCurSlide.notes.graphicObjects.onMouseDown(e, X, Y);
            this.private_UpdateCursorXY(true, true);
            if (bFocusOnSlide) {
                this.CheckEmptyPlaceholderNotes();
            }
            if (!ret) {
                this.Document_UpdateSelectionState();
            }
            this.Document_UpdateInterfaceState();
        }
    }
};

CPresentation.prototype.Notes_OnMouseUp = function (e, X, Y) {
    if (!this.FocusOnNotes) {
        return;
    }
    var oCurSlide = this.Slides[this.CurPage];
    if (oCurSlide && oCurSlide.notes) {
        e.ctrlKey = e.CtrlKey;
        e.shiftKey = e.ShiftKey;
        oCurSlide.notes.graphicObjects.onMouseUp(e, X, Y);
        this.private_UpdateCursorXY(true, true);
        if (e.Button === AscCommon.g_mouse_button_right && !this.noShowContextMenu) {
            var ContextData = new AscCommonSlide.CContextMenuData();
            var ConvertedPos = this.DrawingDocument.ConvertCoordsToCursorWR(X, Y, this.CurPage);
            ContextData.X_abs = ConvertedPos.X;
            ContextData.Y_abs = ConvertedPos.Y;
            ContextData.IsSlideSelect = false;
            editor.sync_ContextMenuCallback(ContextData);
        }
        this.noShowContextMenu = false;
        this.Document_UpdateInterfaceState();
        this.Api.sendEvent("asc_onSelectionEnd");
    }
};

CPresentation.prototype.Notes_OnMouseMove = function (e, X, Y) {
    // if(!this.FocusOnNotes){
    //     return;
    // }
    var oCurSlide = this.Slides[this.CurPage];
    if (oCurSlide) {
        if (oCurSlide.notes) {
            e.ctrlKey = e.CtrlKey;
            e.shiftKey = e.ShiftKey;
            editor.sync_MouseMoveStartCallback();
            oCurSlide.notes.graphicObjects.onMouseMove(e, X, Y);
            var bOldFocus = this.FocusOnNotes;
            this.FocusOnNotes = true;
            this.UpdateCursorType(X, Y, e);
            this.FocusOnNotes = bOldFocus;
            editor.sync_MouseMoveEndCallback();
        }
    }
};


CPresentation.prototype.Get_TableStyleForPara = function () {
    return null;
};

CPresentation.prototype.GetSelectionAnchorPos = function () {
    if (this.Slides[this.CurPage]) {
        var selected_objects = this.Slides[this.CurPage].graphicObjects.selectedObjects;
        if (selected_objects.length > 0) {
            var last_object = selected_objects[selected_objects.length - 1];
            var Coords1 = editor.WordControl.m_oDrawingDocument.ConvertCoordsToCursorWR_Comment(last_object.x, last_object.y, this.CurPage);
            var Coords2 = editor.WordControl.m_oDrawingDocument.ConvertCoordsToCursorWR_Comment(last_object.x + last_object.extX, last_object.y, this.CurPage);
            return {X0: Coords1.X, X1: Coords2.X, Y: Coords1.Y};
        } else {

            var Pos = editor.WordControl.m_oDrawingDocument.ConvertCoordsFromCursor2(AscCommon.global_mouseEvent.X, AscCommon.global_mouseEvent.Y);
            var Coords1 = editor.WordControl.m_oDrawingDocument.ConvertCoordsToCursorWR_Comment(0, 0, this.CurPage);
            return {X0: Coords1.X, X1: Coords1.X, Y: Coords1.Y};
        }
    }
    return {X0: 0, X1: 0, Y: 0};
};

CPresentation.prototype.Clear_ContentChanges = function () {
    this.m_oContentChanges.Clear();
};

CPresentation.prototype.Add_ContentChanges = function (Changes) {
    this.m_oContentChanges.Add(Changes);
};

CPresentation.prototype.Refresh_ContentChanges = function () {
    this.m_oContentChanges.Refresh();
};


CPresentation.prototype.Document_Format_Copy = function () {
    this.CopyTextPr = this.GetDirectTextPr();
    this.CopyParaPr = this.GetDirectParaPr();
};

CPresentation.prototype.Document_Format_Paste = function () {
    if (this.CopyTextPr && this.CopyParaPr) {
        var oController = this.GetCurrentController();
        oController && oController.paragraphFormatPaste(this.CopyTextPr, /*this.CopyParaPr*/null, false);
        this.Document_UpdateInterfaceState();
    }
};

// Возвращаем выделенный текст, если в выделении не более 1 параграфа, и там нет картинок, нумерации страниц и т.д.
CPresentation.prototype.GetSelectedText = function (bClearText, oPr) {
    var oController = this.GetCurrentController();
    if (oController) {
        return oController.GetSelectedText(bClearText, oPr);
    }
    return "";
};

//-----------------------------------------------------------------------------------
// Функции для работы с таблицами
//-----------------------------------------------------------------------------------
CPresentation.prototype.ApplyTableFunction = function (Function, bBefore, bAll, Cols, Rows) {
    var result = null;
    if (this.Slides[this.CurPage]) {
        var args;
        if (AscFormat.isRealNumber(Rows) && AscFormat.isRealNumber(Cols)) {
            args = [Rows, Cols];
        } else {
            args = [bBefore];
        }
        var target_text_object = AscFormat.getTargetTextObject(this.Slides[this.CurPage].graphicObjects);
        if (target_text_object && target_text_object.getObjectType() === AscDFH.historyitem_type_GraphicFrame) {
            result = Function.apply(target_text_object.graphicObject, args);
            if (target_text_object.graphicObject.Content.length === 0) {
                this.RemoveTable();
                return result;
            }
            this.Recalculate();
            if (!this.FocusOnNotes) {
                var aConnectors = this.Slides[this.CurPage].graphicObjects.getConnectorsForCheck();
                for (var i = 0; i < aConnectors.length; ++i) {
                    aConnectors[i].calculateTransform(false);
                    var oGroup = aConnectors[i].getMainGroup();
                    if (oGroup) {
                        AscFormat.checkObjectInArray([], oGroup);
                    }
                }
                if (aConnectors.length > 0) {
                    this.Recalculate();
                }
            }
            this.Document_UpdateInterfaceState();
        } else {
            var by_types = this.Slides[this.CurPage].graphicObjects.getSelectedObjectsByTypes(true);
            if (by_types.tables.length === 1) {
                if (Function !== CTable.prototype.DistributeTableCells) {
                    by_types.tables[0].Set_CurrentElement();
                    if (!(bAll === true)) {
                        if (bBefore) {
                            by_types.tables[0].graphicObject.MoveCursorToStartPos();
                        } else {
                            by_types.tables[0].graphicObject.MoveCursorToStartPos();
                        }
                    } else {
                        by_types.tables[0].graphicObject.SelectAll();
                    }
                }

                result = Function.apply(by_types.tables[0].graphicObject, args);
                if (by_types.tables[0].graphicObject.Content.length === 0) {
                    this.RemoveTable();
                    return;
                }
                this.Recalculate();
                if (!this.FocusOnNotes) {
                    var aConnectors = this.Slides[this.CurPage].graphicObjects.getConnectorsForCheck();
                    for (var i = 0; i < aConnectors.length; ++i) {
                        aConnectors[i].calculateTransform(false);
                        var oGroup = aConnectors[i].getMainGroup();
                        if (oGroup) {
                            AscFormat.checkObjectInArray([], oGroup);
                        }
                    }
                    if (aConnectors.length > 0) {
                        this.Recalculate();
                    }
                }
                this.Document_UpdateSelectionState();
                this.Document_UpdateInterfaceState();
            }
        }
    }
    return result;
};


CPresentation.prototype.AddTableRow = function (bBefore) {
    this.ApplyTableFunction(CTable.prototype.AddTableRow, bBefore);
};

CPresentation.prototype.AddTableColumn = function (bBefore) {
    this.ApplyTableFunction(CTable.prototype.AddTableColumn, bBefore);
};

CPresentation.prototype.RemoveTableRow = function () {
    this.ApplyTableFunction(CTable.prototype.RemoveTableRow, undefined);
};

CPresentation.prototype.RemoveTableColumn = function () {
    this.ApplyTableFunction(CTable.prototype.RemoveTableColumn, true);
};

CPresentation.prototype.DistributeTableCells = function (isHorizontally) {
    return this.ApplyTableFunction(CTable.prototype.DistributeTableCells, isHorizontally);
};

CPresentation.prototype.MergeTableCells = function () {
    this.ApplyTableFunction(CTable.prototype.MergeTableCells, false, true);
};

CPresentation.prototype.SplitTableCells = function (Cols, Rows) {
    this.ApplyTableFunction(CTable.prototype.SplitTableCells, true, true, parseInt(Cols, 10), parseInt(Rows, 10));
};

CPresentation.prototype.RemoveTable = function () {
    if (this.Slides[this.CurPage]) {
        var by_types = this.Slides[this.CurPage].graphicObjects.getSelectedObjectsByTypes(true);
        if (by_types.tables.length === 1) {
            by_types.tables[0].deselect(this.Slides[this.CurPage].graphicObjects);
            this.Slides[this.CurPage].graphicObjects.resetInternalSelection();
            if (by_types.tables[0].group) {
                by_types.tables[0].group.removeFromSpTree(by_types.tables[0].Id);
            } else {
                this.Slides[this.CurPage].removeFromSpTreeById(by_types.tables[0].Id);
            }
            by_types.tables[0].setBDeleted(true);
            this.Recalculate();
            this.Document_UpdateInterfaceState();
            this.Document_UpdateSelectionState();
        }
    }
};

CPresentation.prototype.SelectTable = function (Type) {
    if (this.Slides[this.CurPage]) {
        var by_types = this.Slides[this.CurPage].graphicObjects.getSelectedObjectsByTypes(true);
        if (by_types.tables.length === 1) {
            by_types.tables[0].Set_CurrentElement();
            by_types.tables[0].graphicObject.SelectTable(Type);
            this.Document_UpdateSelectionState();
            this.Document_UpdateInterfaceState();
        }
    }
};

CPresentation.prototype.Table_CheckFunction = function (Function) {
    if (this.Slides[this.CurPage]) {
        var target_text_object = AscFormat.getTargetTextObject(this.Slides[this.CurPage].graphicObjects);
        if (target_text_object && target_text_object.getObjectType() === AscDFH.historyitem_type_GraphicFrame) {
            return Function.apply(target_text_object.graphicObject, []);
        }
        //else
        //{
        //    return
        //    var by_types = this.Slides[this.CurPage].graphicObjects.getSelectedObjectsByTypes(true);
        //    if(by_types.tables.length === 1)
        //    {
        //        var ret;
        //        by_types.tables[0].graphicObject.Set_ApplyToAll(true);
        //        ret = Function.apply(by_types.tables[0].graphicObject, []);
        //        by_types.tables[0].graphicObject.Set_ApplyToAll(false);
        //        return ret;
        //    }
        //}
    }
    return false;
};

CPresentation.prototype.CanMergeTableCells = function () {
    return this.Table_CheckFunction(CTable.prototype.CanMergeTableCells);
};

CPresentation.prototype.CanSplitTableCells = function () {
    return this.Table_CheckFunction(CTable.prototype.CanSplitTableCells);
};

CPresentation.prototype.CheckTableCoincidence = function (Table) {
    return false;
};

CPresentation.prototype.Get_PageSizesByDrawingObjects = function () {
    return {W: Page_Width, H: Page_Height};
};
//-----------------------------------------------------------------------------------
// Дополнительные функции
//-----------------------------------------------------------------------------------
CPresentation.prototype.Document_CreateFontMap = function () {
    //TODO !!!!!!!!!!!!!!!!!!!!!!!!!!!
    return;
};

CPresentation.prototype.Document_CreateFontCharMap = function (FontCharMap) {
    //TODO !!!!!!!!!!
};

CPresentation.prototype.Document_Get_AllFontNames = function () {
    var AllFonts = {}, i;
    if (this.defaultTextStyle && this.defaultTextStyle.Document_Get_AllFontNames) {
        this.defaultTextStyle.Document_Get_AllFontNames(AllFonts);
    }
    for (i = 0; i < this.Slides.length; ++i) {
        this.Slides[i].getAllFonts(AllFonts)
    }
    for (i = 0; i < this.slideMasters.length; ++i) {
        this.slideMasters[i].getAllFonts(AllFonts);
    }
    if (this.globalTableStyles) {
        this.globalTableStyles.Document_Get_AllFontNames(AllFonts);
    }

    for (var i = 0; i < this.notesMasters.length; ++i) {
        this.notesMasters[i].getAllFonts(AllFonts);
    }
    for (var i = 0; i < this.notes.length; ++i) {
        this.notes[i].getAllFonts(AllFonts);
    }
    delete AllFonts["+mj-lt"];
    delete AllFonts["+mn-lt"];
    delete AllFonts["+mj-ea"];
    delete AllFonts["+mn-ea"];
    delete AllFonts["+mj-cs"];
    delete AllFonts["+mn-cs"];
    return AllFonts;
};


CPresentation.prototype.Get_AllImageUrls = function (aImages) {
    if (!Array.isArray(aImages)) {
        aImages = [];
    }
    for (var i = 0; i < this.Slides.length; ++i) {
        this.Slides[i].getAllRasterImages(aImages);
    }
    return aImages;
};

CPresentation.prototype.Reassign_ImageUrls = function (images_rename) {
    for (var i = 0; i < this.Slides.length; ++i) {
        this.Slides[i].Reassign_ImageUrls(images_rename);
    }
};


CPresentation.prototype.Get_GraphicObjectsProps = function () {
    if (this.Slides[this.CurPage]) {
        return this.Slides[this.CurPage].graphicObjects.getDrawingProps();
    }
    return null;
};

// Обновляем текущее состояние (определяем где мы находимся, картинка/параграф/таблица/колонтитул)
CPresentation.prototype.Document_UpdateInterfaceState = function () {
    if (this.TurnOffInterfaceEvents) {
        return;
    }
    editor.sync_BeginCatchSelectedElements();
    editor.ClearPropObjCallback();
    if (this.Slides[this.CurPage]) {
        editor.sync_slidePropCallback(this.Slides[this.CurPage]);


        {
            var graphic_objects = this.GetCurrentController();
            if (!graphic_objects) {
                editor.sync_EndCatchSelectedElements();
                return;
            }
            var target_content = graphic_objects.getTargetDocContent(undefined, true),
                drawing_props = graphic_objects.getDrawingProps(), i;
            var para_pr = graphic_objects.getParagraphParaPr(), text_pr = graphic_objects.getParagraphTextPr();
            var flag = undefined;
            if (!para_pr) {
                para_pr = new CParaPr();
                flag = true;
            }
            if (!text_pr) {
                text_pr = new CTextPr();
            }
            editor.textArtPreviewManager.clear();
            var theme = graphic_objects.getTheme();
            text_pr.ReplaceThemeFonts(theme.themeElements.fontScheme);
            editor.sync_PrLineSpacingCallBack(para_pr.Spacing);
            if (!target_content) {
                editor.UpdateTextPr(text_pr);
            }

            if (drawing_props.imageProps && !this.FocusOnNotes) {
                drawing_props.imageProps.Width = drawing_props.imageProps.w;
                drawing_props.imageProps.Height = drawing_props.imageProps.h;
                drawing_props.imageProps.Position = {X: drawing_props.imageProps.x, Y: drawing_props.imageProps.y};
                if (AscFormat.isRealBool(drawing_props.imageProps.locked) && drawing_props.imageProps.locked) {
                    drawing_props.imageProps.Locked = true;
                }
                editor.sync_ImgPropCallback(drawing_props.imageProps);
            }

            if (drawing_props.shapeProps && !this.FocusOnNotes) {
                editor.sync_shapePropCallback(drawing_props.shapeProps);
                editor.sync_VerticalTextAlign(drawing_props.shapeProps.verticalTextAlign);
                editor.sync_Vert(drawing_props.shapeProps.vert);
            }

            if (drawing_props.chartProps && drawing_props.chartProps.chartProps && !this.FocusOnNotes) {
                if (this.bNeedUpdateChartPreview) {
                    editor.chartPreviewManager.clearPreviews();
                    editor.sendEvent("asc_onUpdateChartStyles");
                    this.bNeedUpdateChartPreview = false;
                }
                editor.sync_ImgPropCallback(drawing_props.chartProps);
            }

            if (drawing_props.tableProps && !this.FocusOnNotes) {
                this.CheckTableStyles(this.Slides[this.CurPage], drawing_props.tableProps.TableLook);
                editor.sync_TblPropCallback(drawing_props.tableProps);
                if (!drawing_props.shapeProps) {
                    if (drawing_props.tableProps.CellsVAlign === vertalignjc_Bottom) {
                        editor.sync_VerticalTextAlign(AscFormat.VERTICAL_ANCHOR_TYPE_BOTTOM);
                    } else if (drawing_props.tableProps.CellsVAlign === vertalignjc_Center) {
                        editor.sync_VerticalTextAlign(AscFormat.VERTICAL_ANCHOR_TYPE_CENTER);
                    } else {
                        editor.sync_VerticalTextAlign(AscFormat.VERTICAL_ANCHOR_TYPE_TOP);
                    }
                }
            }
            if (window['IS_NATIVE_EDITOR']) {
                if (!drawing_props.tableProps) {
                    this.CheckTableStylesDefault(this.Slides[this.CurPage]);
                }
            }
            if (target_content) {
                target_content.Document_UpdateInterfaceState();
            } else {
                if (text_pr) {
                    var lang = text_pr && text_pr.Lang.Val ? text_pr.Lang.Val : this.Get_DefaultLanguage();
                    this.Api.sendEvent("asc_onTextLanguage", lang);
                } else {
                    this.Api.sendEvent("asc_onTextLanguage", this.Get_DefaultLanguage());
                }
            }
        }
    }
    editor.sync_EndCatchSelectedElements();
    this.Document_UpdateUndoRedoState();
    this.Document_UpdateRulersState();

    this.Document_UpdateCanAddHyperlinkState();
    editor.sendEvent("asc_onPresentationSize", this.Width, this.Height);
    editor.sendEvent("asc_canIncreaseIndent", this.Can_IncreaseParagraphLevel(true));
    editor.sendEvent("asc_canDecreaseIndent", this.Can_IncreaseParagraphLevel(false));
    editor.sendEvent("asc_onCanGroup", this.canGroup());
    editor.sendEvent("asc_onCanUnGroup", this.canUnGroup());
    AscCommon.g_specialPasteHelper.SpecialPasteButton_Update_Position();
};

CPresentation.prototype.changeBackground = function (bg, arr_ind, bNoCreatePoint) {
    if (bNoCreatePoint === true || this.Document_Is_SelectionLocked(AscCommon.changestype_SlideBg) === false) {
        if (!(bNoCreatePoint === true)) {
            History.Create_NewPoint(AscDFH.historydescription_Presentation_ChangeBackground);
        }
        for (var i = 0; i < arr_ind.length; ++i) {
            this.Slides[arr_ind[i]].changeBackground(bg);
        }

        this.Recalculate();
        for (var i = 0; i < arr_ind.length; ++i) {
            this.DrawingDocument.OnRecalculatePage(arr_ind[i], this.Slides[arr_ind[i]]);
        }

        this.DrawingDocument.OnEndRecalculate(true, false);
        if (!(bNoCreatePoint === true)) {
            this.Document_UpdateInterfaceState();
        }
    }
};

CPresentation.prototype.CheckTableStylesDefault = function (Slide) {
    var tableLook = new CTableLook(true, true, false, false, true, false);
    return this.CheckTableStyles(Slide, tableLook);
};

CPresentation.prototype.CheckTableStyles = function (Slide, TableLook) {
    if (!this.TablesForInterface) {
        this.TablesForInterface = [];
        var _x_mar = 10;
        var _y_mar = 10;
        var _r_mar = 10;
        var _b_mar = 10;
        var _pageW = 297;
        var _pageH = 210;

        var W = (_pageW - _x_mar - _r_mar);
        var H = (_pageH - _y_mar - _b_mar);
        var index = 0;
        AscFormat.ExecuteNoHistory(function () {
            for (var key in this.TableStylesIdMap) {
                if (this.TableStylesIdMap[key]) {
                    this.TablesForInterface[index] = this.Create_TableGraphicFrame(5, 5, Slide, key, W, H - 17, _x_mar, _y_mar, true);
                    this.TablesForInterface[index].setBDeleted(true);
                    index++;
                }
            }
        }, this, []);
    }
    if (this.TablesForInterface.length === 0)
        return;
    var b_table_look = false;
    if (!this.LastTheme || this.LastTheme !== Slide.Layout.Master.Theme
        || this.LastColorScheme !== Slide.Layout.Master.Theme.themeElements.clrScheme
        || !this.LastColorMap || !this.LastColorMap.compare(Slide.Get_ColorMap())
        || !this.LastTableLook
        || (b_table_look = TableLook.m_bFirst_Col !== this.LastTableLook.m_bFirst_Col
            || TableLook.m_bFirst_Row !== this.LastTableLook.m_bFirst_Row
            || TableLook.m_bLast_Col !== this.LastTableLook.m_bLast_Col
            || TableLook.m_bLast_Row !== this.LastTableLook.m_bLast_Row
            || TableLook.m_bBand_Hor !== this.LastTableLook.m_bBand_Hor
            || TableLook.m_bBand_Ver !== this.LastTableLook.m_bBand_Ver)) {


        var only_redraw = !b_table_look && this.LastTheme === Slide.Layout.Master.Theme /*&& this.LastColorScheme === Slide.Layout.Master.Theme.themeElements.clrScheme && Slide.Get_ColorMap().compare(this.LastColorMap)*/;
        this.LastTheme = Slide.Layout.Master.Theme;
        this.LastColorScheme = Slide.Layout.Master.Theme.themeElements.clrScheme;
        this.LastColorMap = Slide.Get_ColorMap();
        this.LastTableLook = TableLook;
        var need_set_recalc = true, i;

        AscFormat.ExecuteNoHistory(function () {
            if (!only_redraw) {
                var TableLook2;
                if (b_table_look) {
                    TableLook2 = new CTableLook(TableLook.m_bFirst_Col, TableLook.m_bFirst_Row, TableLook.m_bLast_Col, TableLook.m_bLast_Row, TableLook.m_bBand_Hor, TableLook.m_bBand_Ver);
                }
                if (this.TablesForInterface[0].parent !== Slide) {
                    need_set_recalc = false;
                    for (i = 0; i < this.TablesForInterface.length; ++i) {
                        this.TablesForInterface[i].setParent(Slide);
                        this.TablesForInterface[i].handleUpdateTheme();
                        if (TableLook2) {
                            this.TablesForInterface[i].graphicObject.Set_TableLook(TableLook2);
                            this.TablesForInterface[i].graphicObject.Recalculate_Page(0);
                        }
                    }
                }
                if (need_set_recalc) {
                    for (i = 0; i < this.TablesForInterface.length; ++i) {
                        if (TableLook) {
                            this.TablesForInterface[i].graphicObject.Set_TableLook(TableLook);
                        }
                        this.TablesForInterface[i].handleUpdateTheme();
                        this.TablesForInterface[i].graphicObject.Recalculate_Page(0);
                    }
                }
            }
            this.DrawingDocument.CheckTableStyles();
        }, this, []);
    }
};

// Обновляем линейки
CPresentation.prototype.Document_UpdateRulersState = function () {
    if (this.TurnOffInterfaceEvents) {
        return;
    }
    if (this.Slides[this.CurPage]) {
        var target_content = this.Slides[this.CurPage].graphicObjects.getTargetDocContent(undefined, true);
        if (target_content && target_content.Parent && target_content.Parent.getObjectType && target_content.Parent.getObjectType() === AscDFH.historyitem_type_TextBody) {
            return this.DrawingDocument.Set_RulerState_Paragraph(null, target_content.Parent.getMargins());
        } else if (target_content instanceof CTable) {
            return target_content.Document_UpdateRulersState(this.CurPage);
        }
    }
    this.DrawingDocument.Set_RulerState_Paragraph(null);
};

// Обновляем линейки
CPresentation.prototype.Document_UpdateSelectionState = function () {
    if (this.TurnOffInterfaceEvents) {
        return;
    }
    var oController = this.GetCurrentController();
    if (oController) {
        oController.updateSelectionState();
    }
};

CPresentation.prototype.Document_UpdateUndoRedoState = function () {
    if (true === this.TurnOffInterfaceEvents)
        return;

    if (true === AscCommon.CollaborativeEditing.Get_GlobalLockSelection())
        return;

    // TODO: Возможно стоит перенсти эту проверку в класс CHistory и присылать
    //       данные события при изменении значения History.Index

    // Проверяем состояние Undo/Redo

    var bCanUndo = this.History.Can_Undo();
    if (true !== bCanUndo && editor && this.CollaborativeEditing && true === this.CollaborativeEditing.Is_Fast() && true !== this.CollaborativeEditing.Is_SingleUser())
        bCanUndo = this.CollaborativeEditing.CanUndo();

    editor.sync_CanUndoCallback(bCanUndo);
    editor.sync_CanRedoCallback(this.History.Can_Redo());
    editor.CheckChangedDocument();

};

CPresentation.prototype.Document_UpdateCanAddHyperlinkState = function () {
    editor.sync_CanAddHyperlinkCallback(this.CanAddHyperlink(false));
};

CPresentation.prototype.Set_CurPage = function (PageNum) {
    if (-1 == PageNum) {
        this.CurPage = -1;
        this.Document_UpdateInterfaceState();
        return false;
    }

    var nNewCurrentPage = Math.min(this.Slides.length - 1, Math.max(0, PageNum));
    if (nNewCurrentPage !== this.CurPage && nNewCurrentPage < this.Slides.length) {
        var oCurrentController = this.GetCurrentController();
        if (oCurrentController) {
            oCurrentController.resetSelectionState();
        }
        this.CurPage = nNewCurrentPage;
        this.FocusOnNotes = false;
        this.Notes_OnResize();
        this.DrawingDocument.Notes_OnRecalculate(this.CurPage, this.Slides[this.CurPage].NotesWidth, this.Slides[this.CurPage].getNotesHeight());
        editor.asc_hideComments();
        this.Document_UpdateInterfaceState();
        if (this.Slides[this.CurPage]) {
            if (this.DrawingDocument.placeholders)
                this.DrawingDocument.placeholders.update(this.Slides[this.CurPage].getPlaceholdersControls());
        }
        return true;
    }

    if (this.Slides[this.CurPage] && this.Slides[this.CurPage].Layout && this.Slides[this.CurPage].Layout.Master) {
        this.lastMaster = this.Slides[this.CurPage].Layout.Master;
    }
    return false;
};

CPresentation.prototype.Get_CurPage = function () {
    return this.CurPage;
};

CPresentation.prototype.private_UpdateCursorXY = function (bUpdateX, bUpdateY) {

    this.private_CheckCursorInField();
};

CPresentation.prototype.private_CheckCursorInField = function () {
    var oPresentationField = this.GetPresentationField();
    if (oPresentationField) {
        oPresentationField.SelectThisElement();
    }
};

CPresentation.prototype.GetPresentationField = function () {
    var oController = this.GetCurrentController();
    var oDocContent;
    if (oController) {
        oDocContent = oController.getTargetDocContent();
        if (oDocContent) {
            return oDocContent.GetPresentationField();
        }
    }
    return null;
};

CPresentation.prototype.resetStateCurSlide = function () {
    var oCurSlide = this.Slides[this.CurPage];
    if (oCurSlide) {
        var bNeedRedraw = false;
        if (AscFormat.checkEmptyPlaceholderContent(oCurSlide.graphicObjects.getTargetDocContent(false, false))) {
            bNeedRedraw = true;
        }
        oCurSlide.graphicObjects.resetSelection(true, false);
        oCurSlide.graphicObjects.clearPreTrackObjects();
        oCurSlide.graphicObjects.clearTrackObjects();
        oCurSlide.graphicObjects.changeCurrentState(new AscFormat.NullState(oCurSlide.graphicObjects));
        if (bNeedRedraw) {
            this.DrawingDocument.OnRecalculatePage(this.CurPage, oCurSlide);
            this.DrawingDocument.OnEndRecalculate();
        }
        oCurSlide.graphicObjects.updateSelectionState();
    }

};


///NOTES
CPresentation.prototype.Notes_OnResize = function () {
    if (!this.Slides[this.CurPage]) {
        return false;
    }
    var oCurSlide = this.Slides[this.CurPage];
    var newNotesWidth = this.DrawingDocument.Notes_GetWidth();
    if (AscFormat.fApproxEqual(oCurSlide.NotesWidth, newNotesWidth)) {
        return false;
    }
    oCurSlide.NotesWidth = newNotesWidth;
    oCurSlide.recalculateNotesShape();
    this.DrawingDocument.Notes_OnRecalculate(this.CurPage, newNotesWidth, oCurSlide.getNotesHeight());
    return true;
};


CPresentation.prototype.Notes_GetHeight = function () {
    if (!this.Slides[this.CurPage]) {
        return 0;
    }
    return this.Slides[this.CurPage].getNotesHeight();
};

CPresentation.prototype.Notes_Draw = function (SlideIndex, graphics) {
    if (this.Slides[SlideIndex]) {
        if (!graphics.IsSlideBoundsCheckerType) {
            AscCommon.CollaborativeEditing.Update_ForeignCursorsPositions();
        }
        this.Slides[SlideIndex].drawNotes(graphics);
    }
};

//-----------------------------------------------------------------------------------
// Undo/Redo функции
//-----------------------------------------------------------------------------------
CPresentation.prototype.Create_NewHistoryPoint = function (Description) {
    this.History.Create_NewPoint(Description);
};

CPresentation.prototype.Document_Undo = function () {

    if (true === AscCommon.CollaborativeEditing.Get_GlobalLock())
        return;

    if (true !== this.History.Can_Undo() && this.Api && this.CollaborativeEditing && true === this.CollaborativeEditing.Is_Fast() && true !== this.CollaborativeEditing.Is_SingleUser()) {
        if (this.CollaborativeEditing.CanUndo() && true === this.Api.canSave) {
            this.CollaborativeEditing.Set_GlobalLock(true);
            this.Api.forceSaveUndoRequest = true;
        }
    } else {
        this.clearThemeTimeouts();
        this.History.Undo();
        this.Recalculate(this.History.RecalculateData);

        this.Document_UpdateSelectionState();
        this.Document_UpdateInterfaceState();
    }
};

CPresentation.prototype.Document_Redo = function () {
    if (true === AscCommon.CollaborativeEditing.Get_GlobalLock())
        return;

    this.clearThemeTimeouts();
    this.History.Redo();
    this.Recalculate(this.History.RecalculateData);

    this.Document_UpdateSelectionState();
    this.Document_UpdateInterfaceState();
};

CPresentation.prototype.Set_FastCollaborativeEditing = function (isOn) {
    AscCommon.CollaborativeEditing.Set_Fast(isOn);
};

CPresentation.prototype.GetSelectionState = function () {
    var s = {};
    s.CurPage = this.CurPage;
    s.FocusOnNotes = this.FocusOnNotes;
    var oController = this.GetCurrentController();
    if (oController) {
        s.slideSelection = oController.getSelectionState();
    }
    return s;
};


CPresentation.prototype.SetSelectionState = function (State) {
    if (State.CurPage > -1) {
        var oSlide = this.Slides[State.CurPage];
        if (oSlide) {
            if (State.FocusOnNotes) {
                oSlide.graphicObjects.resetSelection();
                oSlide.graphicObjects.clearPreTrackObjects();
                oSlide.graphicObjects.clearTrackObjects();
                oSlide.graphicObjects.changeCurrentState(new AscFormat.NullState(oSlide.graphicObjects));
                if (oSlide.notes) {
                    this.FocusOnNotes = true;
                    if (State.slideSelection) {
                        oSlide.notes.graphicObjects.setSelectionState(State.slideSelection);
                    }
                } else {
                    this.FocusOnNotes = false;
                }
            } else {
                if (State.slideSelection) {
                    oSlide.graphicObjects.setSelectionState(State.slideSelection);
                }
            }
        }
    }
    if (State.CurPage !== this.CurPage)
        this.bGoToPage = true;
    this.CurPage = State.CurPage;
};


CPresentation.prototype.Get_SelectionState2 = function () {
    var oState = this.Save_DocumentStateBeforeLoadChanges();
    var oCurController = this.GetCurrentController();
    if (oCurController) {
        var oContent = oCurController.getTargetDocContent(false, false);
        if (oContent) {
            oState.Content2 = oContent;
            oState.SelectionState2 = oContent.Get_SelectionState2();
        }
    }
    return oState;
};

CPresentation.prototype.Set_SelectionState2 = function (oDocState) {
    this.Load_DocumentStateAfterLoadChanges(oDocState);
    var oCurController = this.GetCurrentController();
    if (oCurController) {
        var oContent = oCurController.getTargetDocContent(false, false);
        if (oContent) {
            if (oContent === oDocState.Content2 && oDocState.SelectionState2) {
                oContent.Set_SelectionState2(oDocState.SelectionState2);
            }
        }
    }
};

CPresentation.prototype.Save_DocumentStateBeforeLoadChanges = function () {
    var oDocState = {};
    oDocState.Pos = [];
    oDocState.StartPos = [];
    oDocState.EndPos = [];
    oDocState.CurPage = this.CurPage;
    oDocState.FocusOnNotes = this.FocusOnNotes;
    var oController = this.GetCurrentController();
    if (oController) {
        oDocState.Slide = this.Slides[this.CurPage];
        oController.Save_DocumentStateBeforeLoadChanges(oDocState);
    }

    this.CollaborativeEditing.WatchDocumentPositionsByState(oDocState);
    return oDocState;
};

CPresentation.prototype.Load_DocumentStateAfterLoadChanges = function (oState) {

    this.CollaborativeEditing.UpdateDocumentPositionsByState(oState);
    if (oState.Slide) {
        var oSlide = oState.Slide;
        if (oSlide !== this.Slides[this.CurPage]) {
            var bFind = false;
            for (var i = 0; i < this.Slides.length; ++i) {
                this.Slides[i].setSlideNum(i);
                if (this.Slides[i] === oSlide) {
                    this.CurPage = i;
                    this.bGoToPage = true;
                    bFind = true;
                    if (this.Slides[this.CurPage]) {

                        var oDrawingObjects = this.Slides[this.CurPage].graphicObjects;
                        oDrawingObjects.clearPreTrackObjects();
                        oDrawingObjects.clearTrackObjects();
                        oDrawingObjects.resetSelection(undefined, true, true);
                        oDrawingObjects.changeCurrentState(new AscFormat.NullState(oDrawingObjects));
                    }
                }
            }
            if (!bFind) {
                if (this.CurPage >= this.Slides.length) {
                    this.CurPage = this.Slides.length - 1;
                }
                this.bGoToPage = true;
                if (this.Slides[this.CurPage]) {
                    var oDrawingObjects = this.Slides[this.CurPage].graphicObjects;
                    oDrawingObjects.clearPreTrackObjects();
                    oDrawingObjects.clearTrackObjects();
                    oDrawingObjects.resetSelection(undefined, true, true);
                    oDrawingObjects.changeCurrentState(new AscFormat.NullState(oDrawingObjects));
                }
                return;
            }
        }
        var oDrawingObjects = this.Slides[this.CurPage].graphicObjects;
        oDrawingObjects.clearPreTrackObjects();
        oDrawingObjects.clearTrackObjects();
        oDrawingObjects.resetSelection(undefined, true, true);
        oDrawingObjects.changeCurrentState(new AscFormat.NullState(oDrawingObjects));
        if (oState.FocusOnNotes) {
            if (this.Slides[this.CurPage].notes) {
                this.FocusOnNotes = true;
                this.Slides[this.CurPage].notes.graphicObjects.loadDocumentStateAfterLoadChanges(oState);
            }
        } else {
            this.FocusOnNotes = false;
            oDrawingObjects.loadDocumentStateAfterLoadChanges(oState);
        }

    } else {
        if (oState.CurPage === -1) {
            if (this.Slides.length > 0) {
                this.CurPage = 0;
                this.bGoToPage = true;
            }
        }
        if (this.Slides[this.CurPage]) {
            var oDrawingObjects = this.Slides[this.CurPage].graphicObjects;
            this.FocusOnNotes = false;
            oDrawingObjects.clearPreTrackObjects();
            oDrawingObjects.clearTrackObjects();
            oDrawingObjects.resetSelection(undefined, true, true);
            oDrawingObjects.changeCurrentState(new AscFormat.NullState(oDrawingObjects));
        }
    }
};

CPresentation.prototype.GetSelectedContent = function () {
    return AscFormat.ExecuteNoHistory(function () {
        var oIdMap, curImgUrl;
        var ret = new PresentationSelectedContent(), i;
        ret.PresentationWidth = this.Width;
        ret.PresentationHeight = this.Height;
        if (this.Slides.length > 0) {
            var FocusObjectType = this.GetFocusObjType();
            switch (FocusObjectType) {
                case FOCUS_OBJECT_MAIN: {
                    var oController = this.GetCurrentController();
                    var target_text_object = AscFormat.getTargetTextObject(oController);
                    if (target_text_object) {
                        var doc_content = oController.getTargetDocContent();
                        if (target_text_object.getObjectType() === AscDFH.historyitem_type_GraphicFrame && !doc_content) {
                            if (target_text_object.graphicObject) {
                                var GraphicFrame = target_text_object.copy(undefined);
                                var SelectedContent = new CSelectedContent();
                                target_text_object.graphicObject.GetSelectedContent(SelectedContent);
                                var Table = SelectedContent.Elements[0].Element;
                                GraphicFrame.setGraphicObject(Table);
                                Table.Set_Parent(GraphicFrame);
                                curImgUrl = target_text_object.getBase64Img();
                                ret.Drawings.push(new DrawingCopyObject(GraphicFrame, target_text_object.x, target_text_object.y, target_text_object.extX, target_text_object.extY, curImgUrl));
                            }
                        } else {
                            if (doc_content) {
                                var SelectedContent = new CSelectedContent();
                                doc_content.GetSelectedContent(SelectedContent);
                                ret.DocContent = SelectedContent;
                            }
                        }
                    } else {

                        var selector = this.Slides[this.CurPage].graphicObjects.selection.groupSelection ? this.Slides[this.CurPage].graphicObjects.selection.groupSelection : this.Slides[this.CurPage].graphicObjects;
                        if (selector.selection.chartSelection && selector.selection.chartSelection.selection.title) {
                            var doc_content = selector.selection.chartSelection.selection.title.getDocContent();
                            if (doc_content) {

                                var SelectedContent = new CSelectedContent();
                                doc_content.Set_ApplyToAll(true);
                                doc_content.GetSelectedContent(SelectedContent);
                                doc_content.Set_ApplyToAll(false);
                                ret.DocContent = SelectedContent;
                            }
                        } else {
                            var bRecursive = isRealObject(this.Slides[this.CurPage].graphicObjects.selection.groupSelection);
                            var aSpTree = bRecursive ? this.Slides[this.CurPage].graphicObjects.selection.groupSelection.spTree : this.Slides[this.CurPage].cSld.spTree;
                            oIdMap = {};
                            collectSelectedObjects(aSpTree, ret.Drawings, bRecursive, oIdMap);
                            AscFormat.fResetConnectorsIds(ret.Drawings, oIdMap);
                        }
                    }
                    break;
                }
                case FOCUS_OBJECT_THUMBNAILS : {
                    var selected_slides = this.GetSelectedSlides();
                    for (i = 0; i < selected_slides.length; ++i) {
                        oIdMap = {};
                        var oSlideCopy = this.Slides[selected_slides[i]].createDuplicate(oIdMap);
                        ret.SlideObjects.push(oSlideCopy);
                        AscFormat.fResetConnectorsIds(oSlideCopy.cSld.spTree, oIdMap);
                    }
                }
            }
        }
        return ret;
    }, this, []);
};


CPresentation.prototype.internalResetElementsFontSize = function (aContent) {
    for (var j = 0; j < aContent.length; ++j) {
        if (aContent[j].Type === para_Run) {
            if (aContent[j].Pr && AscFormat.isRealNumber(aContent[j].Pr.FontSize)) {
                var oPr = aContent[j].Pr.Copy();
                oPr.FontSize = undefined;
                aContent[j].Set_Pr(oPr);
            }
        } else if (aContent[j].Type === para_Hyperlink) {
            this.internalResetElementsFontSize(aContent[j].Content);
        }
    }
};
/**Returns array of PresentationSelectedContent for special paste
 * @returns {Array}
 **/
CPresentation.prototype.GetSelectedContent2 = function () {
    return AscFormat.ExecuteNoHistory(function () {
        var aRet = [], oIdMap;
        var oSourceFormattingContent = new PresentationSelectedContent();
        var oEndFormattingContent = new PresentationSelectedContent();
        var oImagesSelectedContent = new PresentationSelectedContent();

        oSourceFormattingContent.PresentationWidth = this.Width;
        oSourceFormattingContent.PresentationHeight = this.Height;
        oEndFormattingContent.PresentationWidth = this.Width;
        oEndFormattingContent.PresentationHeight = this.Height;
        oImagesSelectedContent.PresentationWidth = this.Width;
        oImagesSelectedContent.PresentationHeight = this.Height;
        var oSelectedContent, oDocContent, oController, oTargetTextObject, oGraphicFrame, oTable, oImage, dImageWidth,
            dImageHeight, bNeedSelectAll,
            oDocContentForDraw, oParagraph, oNearPos, bOldVal, aParagraphs, dMaxWidth, oCanvas, oContext, oGraphics,
            dContentHeight, nContentIndents = 30, bOldShowParaMarks, oSelector;
        var i, j;
        if (this.Slides.length > 0) {
            var FocusObjectType = this.GetFocusObjType();
            switch (FocusObjectType) {
                case FOCUS_OBJECT_MAIN: {
                    oController = this.GetCurrentController();
                    oSelector = oController.selection.groupSelection ? oController.selection.groupSelection : oController;
                    oTargetTextObject = AscFormat.getTargetTextObject(oController);
                    bNeedSelectAll = false;
                    if (!oTargetTextObject) {
                        if (oSelector.selection.chartSelection && oSelector.selection.chartSelection.selection.title) {
                            oDocContent = oSelector.selection.chartSelection.selection.title.getDocContent();
                            if (oDocContent) {
                                bNeedSelectAll = true;
                            }
                        }
                    }
                    if (oTargetTextObject) {
                        if (!oDocContent) {
                            oDocContent = oController.getTargetDocContent();
                        }
                        if (oTargetTextObject.getObjectType() === AscDFH.historyitem_type_GraphicFrame && !oDocContent) {
                            if (oTargetTextObject.graphicObject) {
                                oGraphicFrame = oTargetTextObject.copy(undefined);
                                oSelectedContent = new CSelectedContent();
                                oTargetTextObject.graphicObject.GetSelectedContent(oSelectedContent);
                                oTable = oSelectedContent.Elements[0].Element;
                                oGraphicFrame.setGraphicObject(oTable);
                                oTable.Set_Parent(oGraphicFrame);
                                oEndFormattingContent.Drawings.push(new DrawingCopyObject(oGraphicFrame, oTargetTextObject.x, oTargetTextObject.y, oTargetTextObject.extX, oTargetTextObject.extY, oTargetTextObject.getBase64Img()));
                                oGraphicFrame.parent = oTargetTextObject.parent;
                                oGraphicFrame.bDeleted = false;
                                oGraphicFrame.recalculate();
                                oSourceFormattingContent.Drawings.push(new DrawingCopyObject(oGraphicFrame.getCopyWithSourceFormatting(), oTargetTextObject.x, oTargetTextObject.y, oTargetTextObject.extX, oTargetTextObject.extY, oTargetTextObject.getBase64Img()));
                                oImage = oController.createImage(oGraphicFrame.getBase64Img(), 0, 0, oGraphicFrame.extX, oGraphicFrame.extY);
                                oImagesSelectedContent.Drawings.push(new DrawingCopyObject(oImage, 0, 0, oTargetTextObject.extX, oTargetTextObject.extY, oTargetTextObject.getBase64Img()));
                                oGraphicFrame.parent = null;
                                oGraphicFrame.bDeleted = true;
                            }
                        } else {
                            if (oDocContent) {
                                if (bNeedSelectAll) {
                                    oDocContent.Set_ApplyToAll(true);
                                }
                                oSelectedContent = new CSelectedContent();
                                oDocContent.GetSelectedContent(oSelectedContent);
                                oEndFormattingContent.DocContent = oSelectedContent;
                                for (i = 0; i < oSelectedContent.Elements.length; ++i) {
                                    var oElem = oSelectedContent.Elements[i].Element;
                                    if (oElem.GetType() === AscCommonWord.type_Paragraph) {
                                        if (oElem.Pr && oElem.Pr.DefaultRunPr && AscFormat.isRealNumber(oElem.Pr.DefaultRunPr.FontSize)) {
                                            var oPr = oElem.Pr.Copy();
                                            oPr.DefaultRunPr.FontSize = undefined;
                                            oElem.Set_Pr(oPr);
                                        }
                                        this.internalResetElementsFontSize(oElem.Content);
                                    }
                                }
                                oSelectedContent = new CSelectedContent();
                                oDocContent.GetSelectedContent(oSelectedContent);
                                var aContent = [];
                                for (i = 0; i < oSelectedContent.Elements.length; ++i) {
                                    oParagraph = oSelectedContent.Elements[i].Element;
                                    oParagraph.Parent = oDocContent;
                                    oParagraph.private_CompileParaPr();
                                    aContent.push(oParagraph);
                                }
                                AscFormat.SaveContentSourceFormatting(aContent, aContent, oDocContent.Get_Theme(), oDocContent.Get_ColorMap());
                                oSourceFormattingContent.DocContent = oSelectedContent;


                                var oSelectedContent2 = new CSelectedContent();
                                oDocContent.GetSelectedContent(oSelectedContent2);
                                aContent = [];
                                for (i = 0; i < oSelectedContent2.Elements.length; ++i) {
                                    oParagraph = oSelectedContent2.Elements[i].Element;
                                    oParagraph.Parent = oDocContent;
                                    oParagraph.private_CompileParaPr();
                                    aContent.push(oParagraph);
                                }
                                AscFormat.SaveContentSourceFormatting(aContent, aContent, oDocContent.Get_Theme(), oDocContent.Get_ColorMap());

                                if (bNeedSelectAll) {
                                    oDocContent.Set_ApplyToAll(false);
                                }
                                if (oSelectedContent2.Elements.length > 0) {
                                    oDocContentForDraw = new AscFormat.CDrawingDocContent(oDocContent.Parent, oDocContent.DrawingDocument, 0, 0, 20000, 20000);
                                    oParagraph = oDocContentForDraw.Content[0];
                                    oNearPos = {
                                        Paragraph: oParagraph,
                                        ContentPos: oParagraph.Get_ParaContentPos(false, false)
                                    };
                                    oParagraph.Check_NearestPos(oNearPos);
                                    bOldVal = oDocContentForDraw.MoveDrawing;
                                    oDocContentForDraw.MoveDrawing = true;
                                    oDocContentForDraw.InsertContent(oSelectedContent2, oNearPos);
                                    oDocContentForDraw.MoveDrawing = bOldVal;


                                    var oCheckParagraph, aRuns;
                                    for (i = oDocContentForDraw.Content.length - 1; i > -1; --i) {
                                        oCheckParagraph = oDocContentForDraw.Content[i];
                                        if (!oCheckParagraph.IsEmpty()) {
                                            aRuns = oCheckParagraph.Content;
                                            if (aRuns.length > 1) {
                                                for (j = aRuns.length - 2; j > -1; --j) {
                                                    var oRun = aRuns[j];
                                                    if (oRun.Type === para_Run) {
                                                        for (var k = oRun.Content.length - 1; k > -1; --k) {
                                                            if (oRun.Content[k].Type === para_NewLine) {
                                                                oRun.Content.splice(k, 1);
                                                            } else {
                                                                break;
                                                            }
                                                        }
                                                        if (oRun.Content.length === 0) {
                                                            aRuns.splice(j, 1);
                                                        } else {
                                                            break;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        if (oCheckParagraph.IsEmpty()) {
                                            oDocContentForDraw.Internal_Content_Remove(i, 1, false);
                                        } else {

                                            break;
                                        }
                                    }
                                    for (i = 0; i < oDocContentForDraw.Content.length; ++i) {
                                        oCheckParagraph = oDocContentForDraw.Content[i];
                                        if (!oCheckParagraph.IsEmpty()) {
                                            aRuns = oCheckParagraph.Content;
                                            if (aRuns.length > 1) {
                                                for (j = 0; j < aRuns.length - 1; ++j) {
                                                    var oRun = aRuns[j];
                                                    if (oRun.Type === para_Run) {
                                                        for (var k = 0; k < oRun.Content.length; ++k) {
                                                            if (oRun.Content[k].Type === para_NewLine) {
                                                                oRun.Content.splice(k, 1);
                                                                k--;
                                                            } else {
                                                                break;
                                                            }
                                                        }
                                                        if (oRun.Content.length === 0) {
                                                            aRuns.splice(j, 1);
                                                            j--;
                                                        } else {
                                                            break;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        if (oCheckParagraph.IsEmpty()) {
                                            oDocContentForDraw.Internal_Content_Remove(i, 1, false);
                                            i--;
                                        } else {

                                            break;
                                        }
                                    }
                                    if (oDocContentForDraw.Content.length > 0) {

                                        oDocContentForDraw.Reset(0, 0, 20000, 20000);
                                        oDocContentForDraw.Recalculate_Page(0, true);
                                        aParagraphs = oDocContentForDraw.Content;
                                        dMaxWidth = 0;
                                        for (i = 0; i < aParagraphs.length; ++i) {
                                            oParagraph = aParagraphs[i];
                                            for (j = 0; j < oParagraph.Lines.length; ++j) {
                                                if (oParagraph.Lines[j].Ranges[0].W > dMaxWidth) {
                                                    dMaxWidth = oParagraph.Lines[j].Ranges[0].W;
                                                }
                                            }
                                        }
                                        dMaxWidth += 1;


                                        oDocContentForDraw.Reset(0, 0, dMaxWidth, 20000);
                                        oDocContentForDraw.Recalculate_Page(0, true);
                                        dContentHeight = oDocContentForDraw.GetSummaryHeight();

                                        var oTextWarpObject = null;
                                        if (oDocContentForDraw.Parent && oDocContentForDraw.Parent.parent && oDocContentForDraw.Parent.parent instanceof AscFormat.CShape) {
                                            oTextWarpObject = oDocContentForDraw.Parent.parent.checkTextWarp(oDocContentForDraw, oDocContentForDraw.Parent.parent.getBodyPr(), dMaxWidth, dContentHeight, true, false);
                                        }


                                        oCanvas = document.createElement('canvas');
                                        dImageWidth = dMaxWidth;
                                        dImageHeight = dContentHeight;
                                        oCanvas.width = ((dImageWidth * AscCommon.g_dKoef_mm_to_pix) + 2 * nContentIndents + 0.5) >> 0;
                                        oCanvas.height = ((dImageHeight * AscCommon.g_dKoef_mm_to_pix) + 2 * nContentIndents + 0.5) >> 0;
                                        //if (AscCommon.AscBrowser.isRetina) {
                                        //    oCanvas.width <<= 1;
                                        //    oCanvas.height <<= 1;
                                        //}

                                        var sImageUrl;
                                        if (!window["NATIVE_EDITOR_ENJINE"]) {
                                            oContext = oCanvas.getContext('2d');
                                            oGraphics = new AscCommon.CGraphics();

                                            oGraphics.init(oContext, oCanvas.width, oCanvas.height, dImageWidth + 2.0 * nContentIndents / AscCommon.g_dKoef_mm_to_pix, dImageHeight + 2.0 * nContentIndents / AscCommon.g_dKoef_mm_to_pix);
                                            oGraphics.m_oFontManager = AscCommon.g_fontManager;
                                            oGraphics.m_oCoordTransform.tx = nContentIndents;
                                            oGraphics.m_oCoordTransform.ty = nContentIndents;
                                            oGraphics.transform(1, 0, 0, 1, 0, 0);

                                            if (oTextWarpObject && oTextWarpObject.oTxWarpStructNoTransform) {
                                                oTextWarpObject.oTxWarpStructNoTransform.draw(oGraphics, oDocContentForDraw.Parent.parent.Get_Theme(), oDocContentForDraw.Parent.parent.Get_ColorMap());
                                            } else {

                                                bOldShowParaMarks = this.Api.ShowParaMarks;
                                                this.Api.ShowParaMarks = false;
                                                oDocContentForDraw.Draw(0, oGraphics);
                                                this.Api.ShowParaMarks = bOldShowParaMarks;
                                            }
                                            sImageUrl = oCanvas.toDataURL("image/png");
                                        } else {
                                            sImageUrl = "";
                                        }

                                        oImage = oController.createImage(sImageUrl, 0, 0, oCanvas.width * AscCommon.g_dKoef_pix_to_mm, oCanvas.height * AscCommon.g_dKoef_pix_to_mm);
                                        oImagesSelectedContent.Drawings.push(new DrawingCopyObject(oImage, 0, 0, dImageWidth, dImageHeight, sImageUrl));
                                    }
                                }
                            }
                        }
                    } else {
                        var bRecursive = isRealObject(oController.selection.groupSelection);
                        var aSpTree = bRecursive ? oController.selection.groupSelection.spTree : this.Slides[this.CurPage].cSld.spTree;
                        oIdMap = {};

                        var oTheme = oController.getTheme();
                        if (oTheme) {
                            oEndFormattingContent.ThemeName = oTheme.name;
                            oSourceFormattingContent.ThemeName = oTheme.name;
                            oImagesSelectedContent.ThemeName = oTheme.name;
                        }
                        collectSelectedObjects(aSpTree, oEndFormattingContent.Drawings, bRecursive, oIdMap);
                        AscFormat.fResetConnectorsIds(oEndFormattingContent.Drawings, oIdMap);
                        oIdMap = {};
                        collectSelectedObjects(aSpTree, oSourceFormattingContent.Drawings, bRecursive, oIdMap, true);
                        AscFormat.fResetConnectorsIds(oSourceFormattingContent.Drawings, oIdMap);
                        if (oController.selectedObjects.length > 0) {
                            var oController2 = oController.selection.groupSelection ? oController.selection.groupSelection : oController;
                            var _bounds_cheker = new AscFormat.CSlideBoundsChecker();

                            var dKoef = AscCommon.g_dKoef_mm_to_pix;
                            var w_mm = 210;
                            var h_mm = 297;
                            var w_px = (w_mm * dKoef + 0.5) >> 0;
                            var h_px = (h_mm * dKoef + 0.5) >> 0;

                            _bounds_cheker.init(w_px, h_px, w_mm, h_mm);
                            _bounds_cheker.transform(1, 0, 0, 1, 0, 0);

                            _bounds_cheker.AutoCheckLineWidth = true;
                            for (i = 0; i < oController2.selectedObjects.length; ++i) {
                                oController2.selectedObjects[i].draw(_bounds_cheker);
                            }

                            var _need_pix_width = _bounds_cheker.Bounds.max_x - _bounds_cheker.Bounds.min_x + 1;
                            var _need_pix_height = _bounds_cheker.Bounds.max_y - _bounds_cheker.Bounds.min_y + 1;

                            if (_need_pix_width > 0 && _need_pix_height > 0) {

                                var _canvas = document.createElement('canvas');
                                _canvas.width = _need_pix_width;
                                _canvas.height = _need_pix_height;

                                var _ctx = _canvas.getContext('2d');


                                var sImageUrl;
                                if (!window["NATIVE_EDITOR_ENJINE"]) {
                                    var g = new AscCommon.CGraphics();
                                    g.init(_ctx, w_px, h_px, w_mm, h_mm);
                                    g.m_oFontManager = AscCommon.g_fontManager;

                                    g.m_oCoordTransform.tx = -_bounds_cheker.Bounds.min_x;
                                    g.m_oCoordTransform.ty = -_bounds_cheker.Bounds.min_y;
                                    g.transform(1, 0, 0, 1, 0, 0);


                                    AscCommon.IsShapeToImageConverter = true;
                                    for (i = 0; i < oController2.selectedObjects.length; ++i) {
                                        oController2.selectedObjects[i].draw(g);
                                    }
                                    AscCommon.IsShapeToImageConverter = false;

                                    try {
                                        sImageUrl = _canvas.toDataURL("image/png");
                                    } catch (err) {
                                        sImageUrl = "";
                                    }
                                } else {
                                    sImageUrl = "";
                                }


                                oImage = oController.createImage(sImageUrl, _bounds_cheker.Bounds.min_x * AscCommon.g_dKoef_pix_to_mm, _bounds_cheker.Bounds.min_y * AscCommon.g_dKoef_pix_to_mm, (_canvas.width) * AscCommon.g_dKoef_pix_to_mm, (_canvas.height) * AscCommon.g_dKoef_pix_to_mm);
                                oImagesSelectedContent.Drawings.push(new DrawingCopyObject(oImage, 0, 0, (_canvas.width) * AscCommon.g_dKoef_pix_to_mm, (_canvas.height) * AscCommon.g_dKoef_pix_to_mm, sImageUrl));
                            }

                        }
                    }
                    break;
                }
                case FOCUS_OBJECT_THUMBNAILS : {
                    var selected_slides = this.GetSelectedSlides();
                    var oLayoutsMap = {}, oMastersMap = {}, oThemesMap = {}, oSlide, oSlideCopy, oLayout, oMaster,
                        oTheme, oNotesCopy, oNotes;
                    for (i = 0; i < selected_slides.length; ++i) {
                        oIdMap = {};
                        oSlide = this.Slides[selected_slides[i]];
                        oSlideCopy = oSlide;//.createDuplicate(oIdMap);
                        oLayout = oSlide.Layout;
                        if (!oLayoutsMap[oLayout.Get_Id()]) {
                            oLayoutsMap[oLayout.Get_Id()] = oLayout;
                            oSourceFormattingContent.LayoutsIndexes.push(oSourceFormattingContent.Layouts.length);
                            oSourceFormattingContent.Layouts.push(oLayout);
                            oMaster = oLayout.Master;
                            if (!oMastersMap[oMaster.Get_Id()]) {
                                oMastersMap[oMaster.Get_Id()] = oMaster;
                                oSourceFormattingContent.MastersIndexes.push(oSourceFormattingContent.Masters.length);
                                oSourceFormattingContent.Masters.push(oMaster);
                                oTheme = oMaster.Theme;
                                if (!oThemesMap[oTheme.Get_Id()]) {
                                    oSourceFormattingContent.ThemesIndexes.push(oSourceFormattingContent.Themes.length);
                                    oSourceFormattingContent.Themes.push(oTheme);
                                } else {
                                    for (j = 0; j < oSourceFormattingContent.Themes.length; ++j) {
                                        if (oSourceFormattingContent.Themes[j] === oTheme) {
                                            oSourceFormattingContent.ThemesIndexes.push(j);
                                            break;
                                        }
                                    }
                                }
                            } else {
                                for (j = 0; j < oSourceFormattingContent.Masters.length; ++j) {
                                    if (oSourceFormattingContent.Masters[j] === oMaster) {
                                        oSourceFormattingContent.MastersIndexes.push(j);
                                        break;
                                    }
                                }
                            }
                        } else {
                            for (j = 0; j < oSourceFormattingContent.Layouts.length; ++j) {
                                if (oSourceFormattingContent.Layouts[j] === oLayout) {
                                    oSourceFormattingContent.LayoutsIndexes.push(j);
                                    break;
                                }
                            }
                        }
                        oSourceFormattingContent.SlideObjects.push(oSlideCopy);
                        oEndFormattingContent.SlideObjects.push(oSlideCopy);

                        if (i === 0) {
                            var sRasterImageId = oSlide.getBase64Img();
                            oImage = AscFormat.DrawingObjectsController.prototype.createImage(sRasterImageId, 0, 0, this.Width / 2.0, this.Height / 2.0);
                            oImagesSelectedContent.Drawings.push(new DrawingCopyObject(oImage, 0, 0, this.Width / 2.0, this.Height / 2.0, sRasterImageId));
                        }
                        oNotes = null;
                        if (oSlide.notes) {
                            oNotes = oSlide.notes;
                            oNotesCopy = oNotes;//.createDuplicate();
                            oSourceFormattingContent.Notes.push(oNotesCopy);
                            oEndFormattingContent.Notes.push(oNotesCopy);
                            for (j = 0; j < oSourceFormattingContent.NotesMasters.length; ++j) {
                                if (oSourceFormattingContent.NotesMasters[j] === oNotes.Master) {
                                    oSourceFormattingContent.NotesMastersIndexes.push(j);
                                    oEndFormattingContent.NotesMastersIndexes.push(j);
                                    break;
                                }
                            }
                            if (j === oSourceFormattingContent.NotesMasters.length) {
                                oSourceFormattingContent.NotesMastersIndexes.push(j);
                                oSourceFormattingContent.NotesMasters.push(oNotes.Master);
                                oSourceFormattingContent.NotesThemes.push(oNotes.Master.Theme);
                                oEndFormattingContent.NotesMastersIndexes.push(j);
                                oEndFormattingContent.NotesMasters.push(oNotes.Master);
                                oEndFormattingContent.NotesThemes.push(oNotes.Master.Theme);
                            }
                        } else {
                            oSourceFormattingContent.Notes.push(null);
                            oSourceFormattingContent.NotesMastersIndexes.push(-1);
                            oEndFormattingContent.Notes.push(null);
                            oEndFormattingContent.NotesMastersIndexes.push(-1);
                        }
                    }
                }
            }
        }
        aRet.push(oEndFormattingContent);
        aRet.push(oSourceFormattingContent);
        aRet.push(oImagesSelectedContent);
        return aRet;
    }, this, []);
};

CPresentation.prototype.CreateAndAddShapeFromSelectedContent = function (oDocContent) {
    var track_object = new AscFormat.NewShapeTrack("textRect", 0, 0, this.Slides[this.CurPage].Layout.Master.Theme, this.Slides[this.CurPage].Layout.Master, this.Slides[this.CurPage].Layout, this.Slides[this.CurPage], this.CurPage);
    track_object.track({}, 0, 0);
    var shape = track_object.getShape(false, this.DrawingDocument, this.Slides[this.CurPage]);
    shape.setParent(this.Slides[this.CurPage]);
    var paragraph = shape.txBody.content.Content[0];
    var NearPos = {Paragraph: paragraph, ContentPos: paragraph.Get_ParaContentPos(false, false)};
    paragraph.Check_NearestPos(NearPos);
    var old_val = oDocContent.MoveDrawing;
    oDocContent.MoveDrawing = true;
    shape.txBody.content.InsertContent(oDocContent, NearPos);
    oDocContent.MoveDrawing = old_val;
    var body_pr = shape.getBodyPr();
    var w = shape.txBody.getMaxContentWidth(this.Width / 2, true) + body_pr.lIns + body_pr.rIns;
    var h = shape.txBody.content.GetSummaryHeight() + body_pr.tIns + body_pr.bIns;
    shape.spPr.xfrm.setExtX(w);
    shape.spPr.xfrm.setExtY(h);
    shape.spPr.xfrm.setOffX((this.Width - w) / 2);
    shape.spPr.xfrm.setOffY((this.Height - h) / 2);
    shape.setParent(this.Slides[this.CurPage]);
    shape.addToDrawingObjects();
    return shape;
};

/** insert content from aContents, aContents[0] - end formatting, aContents[1] - source formatting, aContents[2] - image
 * @param {Array} aContents
 * @param {number} nIndex
 * */
CPresentation.prototype.InsertContent2 = function (aContents, nIndex) {
    //nIndex = 1;
    var oContent, oSlide, i, j, bEndFormatting = (nIndex === 0), oSourceContent, kw = 1.0, kh = 1.0;
    var nLayoutIndex, nMasterIndex, nNotesMasterIndex;
    var oLayout, oMaster, oTheme, oNotes, oNotesMaster, oNotesTheme, oCurrentMaster, bChangeSize = false;
    var bNeedGenerateThumbnails = false;
    if (!aContents[nIndex]) {
        return;
    }
    if (this.Slides[this.CurPage] && this.Slides[this.CurPage].Layout && this.Slides[this.CurPage].Layout.Master) {
        oCurrentMaster = this.Slides[this.CurPage] && this.Slides[this.CurPage].Layout && this.Slides[this.CurPage].Layout.Master;
    } else {
        oCurrentMaster = this.slideMasters[0];
    }
    if (!oCurrentMaster) {
        return;
    }
    oContent = aContents[nIndex].copy();
    if (oContent.SlideObjects.length > 0) {
        if (oContent.PresentationWidth !== null && oContent.PresentationHeight !== null) {
            if (!AscFormat.fApproxEqual(this.Width, oContent.PresentationWidth) || !AscFormat.fApproxEqual(this.Height, oContent.PresentationHeight)) {
                bChangeSize = true;
                kw = this.Width / oContent.PresentationWidth;
                kh = this.Height / oContent.PresentationHeight;
            }
        }
        if (bEndFormatting) {
            oSourceContent = aContents[1];
            for (i = 0; i < oContent.SlideObjects.length; ++i) {
                oSlide = oContent.SlideObjects[i];
                if (bChangeSize) {
                    oSlide.Width = oContent.PresentationWidth;
                    oSlide.Height = oContent.PresentationHeight;
                    oSlide.changeSize(this.Width, this.Height);
                }
                nLayoutIndex = oSourceContent.LayoutsIndexes[i];
                oLayout = oSourceContent.Layouts[nLayoutIndex];
                if (oLayout) {
                    oSlide.setLayout(oCurrentMaster.getMatchingLayout(oLayout.type, oLayout.matchingName, oLayout.cSld.name, true));
                } else {
                    oSlide.setLayout(oCurrentMaster.sldLayoutLst[0]);
                }
                oNotes = oContent.Notes[i];
                if (!oNotes) {
                    oNotes = AscCommonSlide.CreateNotes();
                }
                oSlide.setNotes(oNotes);
                oSlide.notes.setNotesMaster(this.notesMasters[0]);
                oSlide.notes.setSlide(oSlide);
            }
        } else {
            bNeedGenerateThumbnails = true;
            for (i = 0; i < oContent.Masters.length; ++i) {
                if (bChangeSize) {
                    oContent.Masters[i].scale(kw, kh);
                }
                this.addSlideMaster(this.slideMasters.length, oContent.Masters[i]);
            }
            for (i = 0; i < oContent.Layouts.length; ++i) {
                oLayout = oContent.Layouts[i];
                if (bChangeSize) {
                    oLayout.scale(kw, kh);
                }
                nMasterIndex = oContent.MastersIndexes[i];
                oMaster = oContent.Masters[nMasterIndex];
                if (oMaster) {
                    oMaster.addLayout(oLayout);
                }

            }
            for (i = 0; i < oContent.SlideObjects.length; ++i) {
                oSlide = oContent.SlideObjects[i];
                if (bChangeSize) {
                    oSlide.Width = oContent.PresentationWidth;
                    oSlide.Height = oContent.PresentationHeight;
                    oSlide.changeSize(this.Width, this.Height);
                }
                nLayoutIndex = oContent.LayoutsIndexes[i];
                oLayout = oContent.Layouts[nLayoutIndex];
                oSlide.setLayout(oLayout);

                nLayoutIndex = oContent.LayoutsIndexes[i];
                oLayout = oContent.Layouts[nLayoutIndex];
                nMasterIndex = oContent.MastersIndexes[nLayoutIndex];
                oMaster = oContent.Masters[nMasterIndex];
                oTheme = oContent.Themes[nMasterIndex];
                oNotes = oContent.Notes[i];
                nNotesMasterIndex = oContent.NotesMastersIndexes[i];
                oNotesMaster = oContent.NotesMastersIndexes[nNotesMasterIndex];
                oNotesTheme = oContent.NotesThemes[nNotesMasterIndex];
                if (!oMaster.Theme) {
                    oMaster.setTheme(oTheme);
                }
                if (!oLayout.Master) {
                    oLayout.setMaster(oMaster);
                }
                if (!oNotes || !oNotesMaster || !oNotesTheme) {
                    oSlide.setNotes(AscCommonSlide.CreateNotes());
                    oSlide.notes.setNotesMaster(this.notesMasters[0]);
                    oSlide.notes.setSlide(oSlide);
                } else {
                    if (!oNotesMaster.Themes) {
                        oNotesMaster.setTheme(oNotesTheme);
                    }
                    if (!oNotes.Master) {
                        oNotes.setNotes(oNotesMaster);
                    }
                    if (!oSlide.notes) {
                        oSlide.setNotes(oNotes);
                    }
                }
            }
        }
    }
    if (oContent.Drawings.length > 0) {
        if (bEndFormatting) {
            var oCurSlide = this.Slides[this.CurPage];
            oSourceContent = aContents[1];
            if (oCurSlide && !this.FocusOnNotes && oSourceContent) {
                AscFormat.checkDrawingsTransformBeforePaste(oContent, oSourceContent, oCurSlide);
            }
        }
    }
    if (oContent.DocContent && oContent.DocContent.Elements.length > 0 && nIndex === 0) {
        var oTextPr, oTextPr2, oParaTextPr;
        var oController = this.GetCurrentController();
        if (oController) {
            var oTargetDocContent = oController.getTargetDocContent();
            if (oTargetDocContent) {
                var oCurParagraph = oTargetDocContent.GetCurrentParagraph();
                if (oCurParagraph) {
                    oTextPr = oCurParagraph.Internal_CompiledParaPrPresentation(undefined, true).TextPr;

                    var fApplyPropsToContent = function (content, textpr) {
                        for (var j = 0; j < content.length; ++j) {
                            if (content[j].Get_Type) {
                                if (content[j].Get_Type() === para_Run) {
                                    if (content[j].Pr) {
                                        var oTextPr2 = textpr.Copy();
                                        oTextPr2.Merge(content[j].Pr);
                                        content[j].Set_Pr(oTextPr2);
                                    }
                                } else if (content[j].Get_Type() === para_Hyperlink) {
                                    fApplyPropsToContent(content[j].Content, textpr);
                                }
                            }

                        }
                    };
                    for (i = 0; i < oContent.DocContent.Elements.length; ++i) {
                        if (oContent.DocContent.Elements[i].Element.GetType() === AscCommonWord.type_Paragraph) {
                            var aContent = oContent.DocContent.Elements[i].Element.Content;
                            fApplyPropsToContent(aContent, oTextPr);
                        }
                    }
                }
            }

        }

        oTextPr = this.GetCalculatedTextPr();
        if (oTextPr && AscFormat.isRealNumber(oTextPr.FontSize)) {
            oTextPr2 = new AscCommonWord.CTextPr();
            oTextPr2.FontSize = oTextPr.FontSize;
            oParaTextPr = new AscCommonWord.ParaTextPr(oTextPr2);
            for (i = 0; i < oContent.DocContent.Elements.length; ++i) {
                if (oContent.DocContent.Elements[i].Element.GetType() === AscCommonWord.type_Paragraph) {
                    oContent.DocContent.Elements[i].Element.Set_ApplyToAll(true);
                    oContent.DocContent.Elements[i].Element.AddToParagraph(oParaTextPr);
                    oContent.DocContent.Elements[i].Element.Set_ApplyToAll(false);
                }
            }
        }
    }
    var bRet = this.InsertContent(oContent);
    if (bNeedGenerateThumbnails) {
        for (i = 0; i < this.slideMasters.length; ++i) {
            this.slideMasters[i].setThemeIndex(-i - 1);
        }
        this.SendThemesThumbnails();
    }
    return bRet;
};

CPresentation.prototype.InsertContent = function (Content) {
    var bInsert = false;
    var selected_slides = this.GetSelectedSlides(), i;
    if (Content.SlideObjects.length > 0) {
        var las_slide_index = selected_slides.length > 0 ? selected_slides[selected_slides.length - 1] : -1;

        this.needSelectPages.length = 0;
        for (i = 0; i < Content.SlideObjects.length; ++i) {
            this.insertSlide(las_slide_index + i + 1, Content.SlideObjects[i]);
            this.needSelectPages.push(las_slide_index + i + 1);
        }
        this.CurPage = las_slide_index + 1;
        this.bGoToPage = true;
        this.bNeedUpdateTh = true;
        this.FocusOnNotes = false;
        this.CheckEmptyPlaceholderNotes();
        bInsert = true;

    } else if (this.Slides[this.CurPage]) {
        if (Content.Drawings.length > 0) {
            if (this.FocusOnNotes && Content.Drawings.length === 1 && Content.Drawings[0].Drawing instanceof AscFormat.CGraphicFrame
                && Content.Drawings[0].Drawing.graphicObject) {
                var oContent = AscFormat.ExecuteNoHistory(
                    function () {
                        var oTable = Content.Drawings[0].Drawing.graphicObject;
                        var oResult = new AscFormat.CDrawingDocContent(this, this.DrawingDocument, 0, 0, 3000, 2000);
                        for (var i = 0; i < oTable.Content.length; ++i) {
                            var oRow = oTable.Content[i];
                            for (var j = 0; j < oRow.Content.length; ++j) {
                                var oCurDocContent = oRow.Content[j].Content;
                                for (var k = 0; k < oCurDocContent.Content.length; ++k) {
                                    oResult.Content.push(oCurDocContent.Content[k]);
                                }
                            }
                        }
                        if (oResult.Content.length > 1) {
                            oResult.Content.splice(0, 1);
                        }
                        return oResult;
                    }, this, []
                );
                var oSelectedContent = new CSelectedContent();
                oContent.SelectAll();
                oContent.GetSelectedContent(oSelectedContent);
                var PresentSelContent = new PresentationSelectedContent();
                PresentSelContent.DocContent = oSelectedContent;
                this.InsertContent(PresentSelContent);
                this.Check_CursorMoveRight();
                return true;
            } else {
                this.FocusOnNotes = false;
                this.Slides[this.CurPage].graphicObjects.resetSelection();
                for (i = 0; i < Content.Drawings.length; ++i) {
                    var bInsertShape = true;
                    var oCopyObject = Content.Drawings[i];
                    var oSp = oCopyObject.Drawing;
                    var oSlidePh, oLayoutPlaceholder;

                    var nType, nIdx;
                    if (oSp.isPlaceholder()) {
                        var oInfo = {};
                        nType = oSp.getPlaceholderType();
                        nIdx = oSp.getPlaceholderIndex();
                        oSlidePh = this.Slides[this.CurPage].getMatchingShape(nType, nIdx, false, oInfo);
                        oLayoutPlaceholder = this.Slides[this.CurPage].Layout.getMatchingShape(nType, nIdx, false, oInfo);
                        if (oSp.isEmptyPlaceholder()) {
                            if (!oLayoutPlaceholder || oInfo.bBadMatch) {
                                bInsertShape = false;
                            } else {
                                if (oSlidePh) {
                                    bInsertShape = false;
                                }
                            }
                        }
                    }
                    if (bInsertShape) {
                        if (oSp.bDeleted) {
                            if (oSp.setBDeleted2) {
                                oSp.setBDeleted2(false);
                            } else if (oSp.setBDeleted) {
                                oSp.setBDeleted(false);
                            }
                        }
                        oSp.setParent2(this.Slides[this.CurPage]);
                        if (oSp.getObjectType() === AscDFH.historyitem_type_GraphicFrame) {
                            this.Check_GraphicFrameRowHeight(oSp);
                        }
                        oSp.addToDrawingObjects();
                        oSp.checkExtentsByDocContent && oSp.checkExtentsByDocContent();
                        if (oSp.isPlaceholder()) {
                            if (oSlidePh || !oLayoutPlaceholder) {
                                var oNvProps = oSp.getNvProps();
                                if (oNvProps && oNvProps.ph) {


                                    if (oSp.txBody) {
                                        var oLstStyles = new AscFormat.TextListStyle(), oLstStylesTmp, oParentObjects;
                                        oParentObjects = oSp.getParentObjects();
                                        if (oParentObjects && oParentObjects.master && oParentObjects.master.txStyles) {

                                            oLstStylesTmp = oParentObjects.master.txStyles.getStyleByPhType(nType);
                                            if (oLstStylesTmp) {
                                                oLstStyles.merge(oLstStylesTmp);
                                            }
                                        }

                                        var aHierarhy = oSp.getHierarchy();
                                        var oBodyPr = new AscFormat.CBodyPr();
                                        for (var s = aHierarhy.length - 1; s > -1; --s) {
                                            if (aHierarhy[s]) {
                                                if (aHierarhy[s].txBody) {
                                                    oLstStyles.merge(aHierarhy[s].txBody.lstStyle);
                                                    oBodyPr.merge(aHierarhy[s].txBody.bodyPr);
                                                }
                                            }
                                        }
                                        oLstStyles.merge(oSp.txBody.lstStyle);
                                        oSp.txBody.setLstStyle(oLstStyles);
                                        oSp.txBody.setBodyPr(oBodyPr);
                                    }
                                    oNvProps.setPh(null);
                                }
                            }
                        }
                        this.Slides[this.CurPage].graphicObjects.selectObject(oSp, 0);
                        bInsert = true;
                    }
                }
                if (Content.DocContent && Content.DocContent.Elements.length > 0) {
                    var shape = this.CreateAndAddShapeFromSelectedContent(Content.DocContent);
                    this.Slides[this.CurPage].graphicObjects.selectObject(shape, 0);
                    bInsert = true;
                }
            }
        } else if (Content.DocContent) {
            Content.DocContent.On_EndCollectElements(this, false);
            if (Content.DocContent.Elements.length > 0) {
                var oController = this.GetCurrentController();
                var target_doc_content = oController.getTargetDocContent(true), paragraph, NearPos;
                if (target_doc_content) {
                    if (target_doc_content.Selection.Use) {
                        oController.removeCallback(1, undefined, undefined, undefined, undefined, undefined);
                    }
                    paragraph = target_doc_content.Content[target_doc_content.CurPos.ContentPos];
                    if (null != paragraph && type_Paragraph == paragraph.GetType()) {
                        NearPos = {Paragraph: paragraph, ContentPos: paragraph.Get_ParaContentPos(false, false)};
                        paragraph.Check_NearestPos(NearPos);


                        var ParaNearPos = NearPos.Paragraph.Get_ParaNearestPos(NearPos);
                        if (null === ParaNearPos || ParaNearPos.Classes.length < 2)
                            return false;

                        var LastClass = ParaNearPos.Classes[ParaNearPos.Classes.length - 1];
                        if (para_Math_Run === LastClass.Type) {
                            // Проверяем, что вставляемый контент тоже формула
                            var Element = Content.DocContent.Elements[0].Element;
                            if (1 !== Content.DocContent.Elements.length || type_Paragraph !== Element.Get_Type() || null === LastClass.Parent)
                                return false;
                            if (!Content.DocContent.CanConvertToMath) {
                                var Math = null;
                                var Count = Element.Content.length;
                                for (var Index = 0; Index < Count; Index++) {
                                    var Item = Element.Content[Index];
                                    if (para_Math === Item.Type && null === Math)
                                        Math = Element.Content[Index];
                                    else if (true !== Item.Is_Empty({SkipEnd: true}))
                                        return false;
                                }
                            }
                        } else if (para_Run !== LastClass.Type)
                            return false;

                        if (null === paragraph.Parent || undefined === paragraph.Parent)
                            return false;


                        var Para = NearPos.Paragraph;
                        var ParaNearPos = Para.Get_ParaNearestPos(NearPos);
                        var LastClass = ParaNearPos.Classes[ParaNearPos.Classes.length - 1];
                        var bInsertMath = false;
                        if (para_Math_Run === LastClass.Type) {
                            var MathRun = LastClass;
                            var NewMathRun = MathRun.Split(ParaNearPos.NearPos.ContentPos, ParaNearPos.Classes.length - 1);
                            var MathContent = ParaNearPos.Classes[ParaNearPos.Classes.length - 2];
                            var MathContentPos = ParaNearPos.NearPos.ContentPos.Data[ParaNearPos.Classes.length - 2];
                            var Element = Content.DocContent.Elements[0].Element;

                            var InsertMathContent = null;
                            for (var nPos = 0, nParaLen = Element.Content.length; nPos < nParaLen; nPos++) {
                                if (para_Math === Element.Content[nPos].Type) {
                                    InsertMathContent = Element.Content[nPos];
                                    break;
                                }
                            }

                            if (null === InsertMathContent) {
                                //try to convert content to ParaMath in simple cases.
                                InsertMathContent = Content.DocContent.ConvertToMath();
                            }

                            if (null !== InsertMathContent) {
                                MathContent.Add_ToContent(MathContentPos + 1, NewMathRun);
                                MathContent.Insert_MathContent(InsertMathContent.Root, MathContentPos + 1, true);
                                bInsertMath = true;
                            }
                        }
                        !bInsertMath && target_doc_content.InsertContent(Content.DocContent, NearPos);
                    }
                    var oTargetTextObject = AscFormat.getTargetTextObject(this.Slides[this.CurPage].graphicObjects);
                    oTargetTextObject && oTargetTextObject.checkExtentsByDocContent && oTargetTextObject.checkExtentsByDocContent();
                    bInsert = true;
                } else {
                    this.FocusOnNotes = false;
                    var shape = this.CreateAndAddShapeFromSelectedContent(Content.DocContent);
                    this.Slides[this.CurPage].graphicObjects.resetSelection();
                    this.Slides[this.CurPage].graphicObjects.selectObject(shape, 0);
                    this.CheckEmptyPlaceholderNotes();
                    bInsert = true;
                }
            }
        }
    }
    return bInsert;
};


CPresentation.prototype.Get_NearestPos = function (Page, X, Y, bNotes) {
    var oCurSlide = this.Slides[this.CurPage];
    if (!oCurSlide) {
        return;
    }
    var oNearestPos;
    if (bNotes) {
        if (oCurSlide.notesShape) {
            var oContent = oCurSlide.notesShape.getDocContent();
            if (oContent) {
                var tx = oCurSlide.notesShape.invertTransformText.TransformPointX(X, Y);
                var ty = oCurSlide.notesShape.invertTransformText.TransformPointY(X, Y);
                return oContent.Get_NearestPos(0, tx, ty, false);
            }
        }
    } else {
        if (oCurSlide.graphicObjects) {
            oNearestPos = oCurSlide.graphicObjects.getNearestPos3(X, Y);
            if (oNearestPos) {
                return oNearestPos;
            }
            return {
                X: X,
                Y: Y,
                Height: 0,
                PageNum: 0,
                Internal: {Line: 0, Page: 0, Range: 0},
                Transform: null,
                Paragraph: null,
                ContentPos: null,
                SearchPos: null
            };
        }
    }
    return null;
};

CPresentation.prototype.SendThemesThumbnails = function () {
    if (window["NATIVE_EDITOR_ENJINE"]) {
        this.DrawingDocument.CheckThemes();
        return;
    }

    if (!window['native']) {
        this.GenerateThumbnails(this.Api.WordControl.m_oMasterDrawer, this.Api.WordControl.m_oLayoutDrawer);
    }
    var _masters = this.slideMasters;
    var aDocumentThemes = this.Api.ThemeLoader.Themes.DocumentThemes;
    var aThemeInfo = this.Api.ThemeLoader.themes_info_document;
    aDocumentThemes.length = 0;
    aThemeInfo.length = 0;
    for (var i = 0; i < _masters.length; i++) {
        if (_masters[i].ThemeIndex < 0)//только темы презентации
        {
            var theme_load_info = new AscCommonSlide.CThemeLoadInfo();
            theme_load_info.Master = _masters[i];
            theme_load_info.Theme = _masters[i].Theme;
            var oTheme = _masters[i].Theme;
            var _lay_cnt = _masters[i].sldLayoutLst.length;
            for (var j = 0; j < _lay_cnt; j++) {
                theme_load_info.Layouts[j] = _masters[i].sldLayoutLst[j];
            }
            var th_info = {};
            th_info.Name = typeof oTheme.name === "string" && oTheme.name.length > 0 ? oTheme.name : "Doc Theme " + (i + 1);
            th_info.Url = "";
            th_info.Thumbnail = _masters[i].ImageBase64;
            var th = new AscCommonSlide.CAscThemeInfo(th_info);
            aDocumentThemes[aDocumentThemes.length] = th;
            th.Index = -this.Api.ThemeLoader.Themes.DocumentThemes.length;
            aThemeInfo[aDocumentThemes.length - 1] = theme_load_info;
        }
    }
    this.Api.sync_InitEditorThemes(this.Api.ThemeLoader.Themes.EditorThemes, aDocumentThemes);
};

CPresentation.prototype.Check_CursorMoveRight = function () {
    var oController = this.GetCurrentController();
    if (oController) {
        if (oController.getTargetDocContent(false, false)) {
            oController.cursorMoveRight(false, false, true);
        }
    }
};


CPresentation.prototype.Get_ParentObject_or_DocumentPos = function (Index) {
    return {Type: AscDFH.historyitem_recalctype_Inline, Data: Index};
};

CPresentation.prototype.Refresh_RecalcData = function (Data) {
    var recalculateMaps, key;
    switch (Data.Type) {
        case AscDFH.historyitem_Presentation_AddSlide: {
            for (var i = Data.Pos; i < this.Slides.length; ++i) {
                if (this.Slides[i]) {
                    this.Slides[i].handleAllContents(function (oContent) {
                        if (oContent) {
                            if (oContent.AllFields && oContent.AllFields.length > 0) {
                                for (var j = 0; j < oContent.AllFields.length; j++) {
                                    oContent.AllFields[j].RecalcInfo.Measure = true;
                                    oContent.AllFields[j].Refresh_RecalcData2();
                                }
                            }
                        }
                    });
                }
            }
            break;
        }
        case AscDFH.historyitem_Presentation_RemoveSlide: {
            for (var i = Data.Pos; i < this.Slides.length; ++i) {
                if (this.Slides[i]) {
                    this.Slides[i].handleAllContents(function (oContent) {
                        if (oContent) {
                            if (oContent.AllFields && oContent.AllFields.length > 0) {
                                for (var j = 0; j < oContent.AllFields.length; j++) {
                                    oContent.AllFields[j].RecalcInfo.Measure = true;
                                    oContent.AllFields[j].Refresh_RecalcData2();
                                }
                            }
                        }
                    });
                }
            }
            break;
        }
        case AscDFH.historyitem_Presentation_SetDefaultTextStyle: {
            for (key = 0; key < this.Slides.length; ++key) {
                this.Slides[key].checkSlideSize();
            }
            this.Restart_CheckSpelling();
            break;
        }
        case AscDFH.historyitem_Presentation_SlideSize: {
            recalculateMaps = this.GetRecalculateMaps();
            for (key in recalculateMaps.masters) {
                if (recalculateMaps.masters.hasOwnProperty(key)) {
                    recalculateMaps.masters[key].checkSlideSize();
                }
            }
            for (key in recalculateMaps.layouts) {
                if (recalculateMaps.layouts.hasOwnProperty(key)) {
                    recalculateMaps.layouts[key].checkSlideSize();
                }
            }
            for (key = 0; key < this.Slides.length; ++key) {
                this.Slides[key].checkSlideSize();
            }
            break;
        }
        case AscDFH.historyitem_Presentation_AddSlideMaster: {
            break;
        }
        case AscDFH.historyitem_Presentation_ChangeTheme: {
            for (var i = 0; i < Data.aIndexes.length; ++i) {
                this.Slides[Data.aIndexes[i]] && this.Slides[Data.aIndexes[i]].checkSlideTheme();
            }
            break;
        }
        case AscDFH.historyitem_Presentation_ChangeColorScheme: {
            recalculateMaps = this.GetRecalculateMaps();
            for (key in recalculateMaps.masters) {
                if (recalculateMaps.masters.hasOwnProperty(key)) {
                    recalculateMaps.masters[key].checkSlideColorScheme();
                }
            }
            for (key in recalculateMaps.layouts) {
                if (recalculateMaps.layouts.hasOwnProperty(key)) {
                    recalculateMaps.layouts[key].checkSlideColorScheme();
                }
            }
            for (var i = 0; i < Data.aIndexes.length; ++i) {
                this.Slides[Data.aIndexes[i]] && this.Slides[Data.aIndexes[i]].checkSlideTheme();
            }
            break;
        }
    }
    this.Refresh_RecalcData2(Data);
};

CPresentation.prototype.Refresh_RecalcData2 = function (Data) {
    switch (Data.Type) {
        case AscDFH.historyitem_Presentation_AddSlide: {
            History.RecalcData_Add({Type: AscDFH.historyitem_recalctype_Drawing, All: true});
            break;
        }
        case AscDFH.historyitem_Presentation_RemoveSlide: {
            History.RecalcData_Add({Type: AscDFH.historyitem_recalctype_Drawing, All: true});
            break;
        }
        case AscDFH.historyitem_Presentation_SlideSize:
        case AscDFH.historyitem_Presentation_SetDefaultTextStyle: {
            History.RecalcData_Add({Type: AscDFH.historyitem_recalctype_Drawing, All: true});
            break;
        }
        case AscDFH.historyitem_Presentation_AddSlideMaster: {
            break;
        }
        case AscDFH.historyitem_Presentation_ChangeTheme: {
            History.RecalcData_Add({Type: AscDFH.historyitem_recalctype_Drawing, Theme: true, ArrInd: Data.aIndexes});
            break;
        }
        case AscDFH.historyitem_Presentation_ChangeColorScheme: {
            History.RecalcData_Add({
                Type: AscDFH.historyitem_recalctype_Drawing,
                ColorScheme: true,
                ArrInd: Data.aIndexes
            });
            break;
        }
    }
};

//-----------------------------------------------------------------------------------
// Функции для работы с гиперссылками
//-----------------------------------------------------------------------------------
CPresentation.prototype.AddHyperlink = function (HyperProps) {
    var oController = this.GetCurrentController();
    if (oController) {
        oController.checkSelectedObjectsAndCallback(oController.hyperlinkAdd, [HyperProps], false, AscDFH.historydescription_Presentation_HyperlinkAdd);
        this.Document_UpdateInterfaceState();
    }
};

CPresentation.prototype.ModifyHyperlink = function (HyperProps) {
    var oController = this.GetCurrentController();
    if (oController) {
        oController.checkSelectedObjectsAndCallback(oController.hyperlinkModify, [HyperProps], false, AscDFH.historydescription_Presentation_HyperlinkModify);
        this.Document_UpdateInterfaceState();
    }
};

CPresentation.prototype.RemoveHyperlink = function () {
    var oController = this.GetCurrentController();
    if (oController) {
        oController.checkSelectedObjectsAndCallback(oController.hyperlinkRemove, [], false, AscDFH.historydescription_Presentation_HyperlinkRemove);
        this.Document_UpdateInterfaceState();
    }
};

CPresentation.prototype.CanAddHyperlink = function (bCheckInHyperlink) {
    var oController = this.GetCurrentController();
    if (oController)
        return oController.hyperlinkCanAdd(bCheckInHyperlink);
    return false;
};

CPresentation.prototype.canGroup = function () {
    if (this.Slides[this.CurPage])
        return this.Slides[this.CurPage].graphicObjects.canGroup();
    return false
};

CPresentation.prototype.canUnGroup = function () {
    if (this.Slides[this.CurPage])
        return this.Slides[this.CurPage].graphicObjects.canUnGroup();
    return false;
};

CPresentation.prototype.getSelectedDrawingObjectsCount = function () {
    var oController = this.GetCurrentController();
    if (!oController) {
        return 0;
    }
    var aSelectedObjects = oController.selection.groupSelection ? oController.selection.groupSelection.selectedObjects : oController.selectedObjects;
    return aSelectedObjects.length;
};

CPresentation.prototype.alignLeft = function (alignType) {
    this.Slides[this.CurPage] && this.Slides[this.CurPage].graphicObjects.alignLeft(alignType === Asc.c_oAscObjectsAlignType.Selected);
    this.Document_UpdateInterfaceState();
};

CPresentation.prototype.alignRight = function (alignType) {
    this.Slides[this.CurPage] && this.Slides[this.CurPage].graphicObjects.alignRight(alignType === Asc.c_oAscObjectsAlignType.Selected);
    this.Document_UpdateInterfaceState();
};

CPresentation.prototype.alignTop = function (alignType) {
    this.Slides[this.CurPage] && this.Slides[this.CurPage].graphicObjects.alignTop(alignType === Asc.c_oAscObjectsAlignType.Selected);
    this.Document_UpdateInterfaceState();
};

CPresentation.prototype.alignBottom = function (alignType) {
    this.Slides[this.CurPage] && this.Slides[this.CurPage].graphicObjects.alignBottom(alignType === Asc.c_oAscObjectsAlignType.Selected);
    this.Document_UpdateInterfaceState();
};

CPresentation.prototype.alignCenter = function (alignType) {
    this.Slides[this.CurPage] && this.Slides[this.CurPage].graphicObjects.alignCenter(alignType === Asc.c_oAscObjectsAlignType.Selected);
    this.Document_UpdateInterfaceState();
};

CPresentation.prototype.alignMiddle = function (alignType) {
    this.Slides[this.CurPage] && this.Slides[this.CurPage].graphicObjects.alignMiddle(alignType === Asc.c_oAscObjectsAlignType.Selected);
    this.Document_UpdateInterfaceState();
};

CPresentation.prototype.distributeHor = function (alignType) {
    var bSelected = (alignType === Asc.c_oAscObjectsAlignType.Selected);
    this.Slides[this.CurPage] && this.Slides[this.CurPage].graphicObjects.checkSelectedObjectsAndCallback(this.Slides[this.CurPage].graphicObjects.distributeHor, [bSelected], false, AscDFH.historydescription_Presentation_DistHor);
    this.Document_UpdateInterfaceState();
};
CPresentation.prototype.distributeVer = function (alignType) {
    var bSelected = (alignType === Asc.c_oAscObjectsAlignType.Selected);
    this.Slides[this.CurPage] && this.Slides[this.CurPage].graphicObjects.checkSelectedObjectsAndCallback(this.Slides[this.CurPage].graphicObjects.distributeVer, [bSelected], false, AscDFH.historydescription_Presentation_DistVer);
    this.Document_UpdateInterfaceState();
};

CPresentation.prototype.bringToFront = function () {
    this.Slides[this.CurPage] && this.Slides[this.CurPage].graphicObjects.checkSelectedObjectsAndCallback(this.Slides[this.CurPage].graphicObjects.bringToFront, [], false, AscDFH.historydescription_Presentation_BringToFront);   //TODO: Передавать тип проверки
    this.Document_UpdateInterfaceState();
};

CPresentation.prototype.bringForward = function () {
    this.Slides[this.CurPage] && this.Slides[this.CurPage].graphicObjects.checkSelectedObjectsAndCallback(this.Slides[this.CurPage].graphicObjects.bringForward, [], false, AscDFH.historydescription_Presentation_BringForward);   //TODO: Передавать тип проверки
    this.Document_UpdateInterfaceState();
};

CPresentation.prototype.sendToBack = function () {

    this.Slides[this.CurPage] && this.Slides[this.CurPage].graphicObjects.checkSelectedObjectsAndCallback(this.Slides[this.CurPage].graphicObjects.sendToBack, [], false, AscDFH.historydescription_Presentation_SendToBack);   //TODO: Передавать тип проверки
    this.Document_UpdateInterfaceState();
};


CPresentation.prototype.bringBackward = function () {
    this.Slides[this.CurPage] && this.Slides[this.CurPage].graphicObjects.checkSelectedObjectsAndCallback(this.Slides[this.CurPage].graphicObjects.bringBackward, [], false, AscDFH.historydescription_Presentation_BringBackward);   //TODO: Передавать тип проверки
    this.Document_UpdateInterfaceState();
};

// Проверяем, находимся ли мы в гиперссылке сейчас
CPresentation.prototype.IsCursorInHyperlink = function (bCheckEnd) {
    var oController = this.GetCurrentController();
    return oController && oController.hyperlinkCheck(bCheckEnd);
};


CPresentation.prototype.RemoveBeforePaste = function () {

    var oController = this.GetCurrentController();
    if (oController) {
        var oTargetContent = oController.getTargetDocContent();
        if (oTargetContent) {
            oTargetContent.Remove(-1, true, true, true, undefined);
        }

    }
};

CPresentation.prototype.addNextSlide = function (layoutIndex) {
    History.Create_NewPoint(AscDFH.historydescription_Presentation_AddNextSlide);
    var new_slide, layout, i, _ph_type, sp, hf, bIsSpecialPh;
    if (this.Slides[this.CurPage]) {
        var cur_slide = this.Slides[this.CurPage];


        layout = AscFormat.isRealNumber(layoutIndex) ? (cur_slide.Layout.Master.sldLayoutLst[layoutIndex] ? cur_slide.Layout.Master.sldLayoutLst[layoutIndex] : cur_slide.Layout) : cur_slide.Layout.Master.getMatchingLayout(cur_slide.Layout.type, cur_slide.Layout.matchingName, cur_slide.Layout.cSld.name);
        hf = layout.Master.hf;
        new_slide = new Slide(this, layout, this.CurPage + 1);
        new_slide.setNotes(AscCommonSlide.CreateNotes());
        new_slide.notes.setNotesMaster(this.notesMasters[0]);
        new_slide.notes.setSlide(new_slide);
        for (i = 0; i < layout.cSld.spTree.length; ++i) {
            if (layout.cSld.spTree[i].isPlaceholder()) {
                _ph_type = layout.cSld.spTree[i].getPhType();
                bIsSpecialPh = _ph_type === AscFormat.phType_dt || _ph_type === AscFormat.phType_ftr || _ph_type === AscFormat.phType_hdr || _ph_type === AscFormat.phType_sldNum;
                if (!bIsSpecialPh || hf && ((_ph_type === AscFormat.phType_dt && (hf.dt !== false)) ||
                    (_ph_type === AscFormat.phType_ftr && (hf.ftr !== false)) ||
                    (_ph_type === AscFormat.phType_hdr && (hf.hdr !== false)) ||
                    (_ph_type === AscFormat.phType_sldNum && (hf.sldNum !== false)))) {
                    sp = layout.cSld.spTree[i].copy(undefined);
                    sp.setParent(new_slide);
                    !bIsSpecialPh && sp.clearContent && sp.clearContent();
                    new_slide.addToSpTreeToPos(new_slide.cSld.spTree.length, sp);
                }
            }
        }
        new_slide.setSlideNum(this.CurPage + 1);
        new_slide.setSlideSize(this.Width, this.Height);
        this.insertSlide(this.CurPage + 1, new_slide);

        for (i = this.CurPage + 2; i < this.Slides.length; ++i) {
            this.Slides[i].setSlideNum(i);
        }
        this.Recalculate();
    } else {

        var master = this.slideMasters[0];
        if (this.lastMaster) {
            master = this.lastMaster;
        }
        layout = AscFormat.isRealNumber(layoutIndex) ? (master.sldLayoutLst[layoutIndex] ? master.sldLayoutLst[layoutIndex] : master.sldLayoutLst[0]) : master.sldLayoutLst[0];
        hf = layout.Master.hf;

        new_slide = new Slide(this, layout, this.CurPage + 1);
        new_slide.setNotes(AscCommonSlide.CreateNotes());
        new_slide.notes.setNotesMaster(this.notesMasters[0]);
        new_slide.notes.setSlide(new_slide);
        for (i = 0; i < layout.cSld.spTree.length; ++i) {
            if (layout.cSld.spTree[i].isPlaceholder()) {
                _ph_type = layout.cSld.spTree[i].getPhType();
                bIsSpecialPh = _ph_type === AscFormat.phType_dt || _ph_type === AscFormat.phType_ftr || _ph_type === AscFormat.phType_hdr || _ph_type === AscFormat.phType_sldNum;
                if (!bIsSpecialPh || hf && ((_ph_type === AscFormat.phType_dt && (hf.dt !== false)) ||
                    (_ph_type === AscFormat.phType_ftr && (hf.ftr !== false)) ||
                    (_ph_type === AscFormat.phType_hdr && (hf.hdr !== false)) ||
                    (_ph_type === AscFormat.phType_sldNum && (hf.sldNum !== false)))) {
                    sp = layout.cSld.spTree[i].copy(undefined);
                    sp.setParent(new_slide);
                    !bIsSpecialPh && sp.clearContent && sp.clearContent();
                    new_slide.addToSpTreeToPos(new_slide.cSld.spTree.length, sp);
                }
            }
        }
        new_slide.setSlideNum(this.CurPage + 1);
        new_slide.setSlideSize(this.Width, this.Height);
        this.insertSlide(this.CurPage + 1, new_slide);
        this.Recalculate();
    }
    this.DrawingDocument.m_oWordControl.GoToPage(this.CurPage + 1);
    this.Document_UpdateInterfaceState();
};


CPresentation.prototype.DublicateSlide = function () {
    if (editor.WordControl.Thumbnails) {
        var selected_slides = this.GetSelectedSlides();
        this.shiftSlides(Math.max.apply(Math, selected_slides) + 1, selected_slides, true);
    }
};

CPresentation.prototype.shiftSlides = function (pos, array, bCopy) {
    if (!this.CanEdit()) {
        return this.CurPage;
    }
    History.Create_NewPoint(AscDFH.historydescription_Presentation_ShiftSlides);
    array.sort(AscCommon.fSortAscending);
    var deleted = [], i;

    if (!(bCopy === true || AscCommon.global_mouseEvent.CtrlKey)) {
        for (i = array.length - 1; i > -1; --i) {
            deleted.push(this.removeSlide(array[i]));
        }

        for (i = 0; i < array.length; ++i) {
            if (array[i] < pos)
                --pos;
            else
                break;
        }
    } else {
        for (i = array.length - 1; i > -1; --i) {
            var oIdMap = {};
            var oSlideCopy = this.Slides[array[i]].createDuplicate(oIdMap);
            AscFormat.fResetConnectorsIds(oSlideCopy.cSld.spTree, oIdMap);
            deleted.push(oSlideCopy);
        }
    }

    var _selectedPage = this.CurPage;
    var _newSelectedPage = 0;

    deleted.reverse();
    for (i = 0; i < deleted.length; ++i) {
        this.insertSlide(pos + i, deleted[i]);
    }
    for (i = 0; i < this.Slides.length; ++i) {
        if (this.Slides[i].num == _selectedPage)
            _newSelectedPage = i;

        this.Slides[i].changeNum(i);
    }
    this.Recalculate();
    this.Document_UpdateUndoRedoState();
    this.DrawingDocument.OnEndRecalculate();
    this.DrawingDocument.UpdateThumbnailsAttack();
    this.DrawingDocument.m_oWordControl.GoToPage(_newSelectedPage);
    return _newSelectedPage;
};

CPresentation.prototype.deleteSlides = function (array) {
    if (array.length > 0 && (this.Document_Is_SelectionLocked(AscCommon.changestype_RemoveSlide, array) === false)) {
        History.Create_NewPoint(AscDFH.historydescription_Presentation_DeleteSlides);
        var oldLen = this.Slides.length;
        array.sort(AscCommon.fSortAscending);
        for (var i = array.length - 1; i > -1; --i) {
            this.removeSlide(array[i]);
        }
        for (i = 0; i < this.Slides.length; ++i) {
            this.Slides[i].changeNum(i);
        }
        if (array[array.length - 1] != oldLen - 1) {
            this.DrawingDocument.m_oWordControl.GoToPage(array[array.length - 1] + 1 - array.length, undefined, true);
        } else {
            this.DrawingDocument.m_oWordControl.GoToPage(this.Slides.length - 1, undefined, true);
        }
        editor.sync_HideComment();
        this.Document_UpdateUndoRedoState();
        this.Recalculate();
        this.DrawingDocument.UpdateThumbnailsAttack();
    }
};

CPresentation.prototype.changeLayout = function (_array, MasterLayouts, layout_index) {
    if (this.Document_Is_SelectionLocked(AscCommon.changestype_Layout) === false) {
        History.Create_NewPoint(AscDFH.historydescription_Presentation_ChangeLayout);
        var oSelectionStateState = null;
        if (this.Slides[this.CurPage]) {
            oSelectionStateState = {};
            this.Slides[this.CurPage].graphicObjects.Save_DocumentStateBeforeLoadChanges(oSelectionStateState);
        }
        var layout = MasterLayouts.sldLayoutLst[layout_index];
        for (var i = 0; i < _array.length; ++i) {
            var slide = this.Slides[_array[i]];
            if (!AscFormat.isRealNumber(layout_index)) {
                layout = slide.Layout;
            }
            slide.setLayout(layout);
            for (var j = slide.cSld.spTree.length - 1; j > -1; --j) {
                var shape = slide.cSld.spTree[j];
                if (shape.isEmptyPlaceholder()) {
                    slide.removeFromSpTreeById(shape.Get_Id());
                } else {
                    var oInfo = {};
                    var hierarchy = shape.getHierarchy(undefined, oInfo);
                    var bNoPlaceholder = true;
                    var bNeedResetTransform = false;
                    var oNotNullPH = null;
                    for (var t = 0; t < hierarchy.length; ++t) {
                        if (hierarchy[t]) {
                            if (hierarchy[t].parent && (hierarchy[t].parent instanceof AscCommonSlide.SlideLayout)) {
                                bNoPlaceholder = false;
                            }
                            if (hierarchy[t].spPr && hierarchy[t].spPr.xfrm && hierarchy[t].spPr.xfrm.isNotNull()) {
                                bNeedResetTransform = true;
                                oNotNullPH = hierarchy[t];
                            }
                        }
                    }
                    if (bNoPlaceholder) {
                        if (slide.cSld.spTree[j].isEmptyPlaceholder()) {
                            slide.removeFromSpTreeById(slide.cSld.spTree[j].Get_Id());
                        } else {
                            var hierarchy2 = shape.getHierarchy(undefined, undefined);
                            for (var t = 0; t < hierarchy2.length; ++t) {
                                if (hierarchy2[t]) {
                                    if (hierarchy2[t].spPr && hierarchy2[t].spPr.xfrm && hierarchy2[t].spPr.xfrm.isNotNull()) {
                                        break;
                                    }
                                }
                            }
                            if (t === hierarchy2.length) {
                                AscFormat.CheckSpPrXfrm(shape);
                            }
                        }
                    } else {
                        if (bNeedResetTransform) {
                            if (shape.spPr && shape.spPr.xfrm && shape.spPr.xfrm.isNotNull()) {
                                if (shape.getObjectType() !== AscDFH.historyitem_type_GraphicFrame) {
                                    shape.spPr.setXfrm(null);
                                } else {
                                    if (oNotNullPH) {
                                        if (!shape.spPr && oNotNullPH.spPr) {
                                            shape.setSpPr(oNotNullPH.spPr.createDuplicate());
                                            shape.spPr.setParent(shape);
                                        }
                                        if (!shape.spPr.xfrm && oNotNullPH.spPr && oNotNullPH.spPr.xfrm) {
                                            shape.spPr.setXfrm(oNotNullPH.spPr.xfrm.createDuplicate());
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                // else
                // {
                //     if(shape.isPlaceholder() && (!shape.spPr || !shape.spPr.xfrm || !shape.spPr.xfrm.isNotNull()))
                //     {
                //         var hierarchy = shape.getHierarchy();
                //         for(var t = 0; t < hierarchy.length; ++t)
                //         {
                //             if(hierarchy[t] && hierarchy[t].spPr && hierarchy[t].spPr.xfrm && hierarchy[t].spPr.xfrm.isNotNull())
                //             {
                //                 break;
                //             }
                //         }
                //         if(t === hierarchy.length)
                //         {
                //             AscFormat.CheckSpPrXfrm(shape);
                //         }
                //     }
                // }
            }
            for (var j = 0; j < layout.cSld.spTree.length; ++j) {
                if (layout.cSld.spTree[j].isPlaceholder()) {
                    var _ph_type = layout.cSld.spTree[j].getPhType();
                    var hf = layout.Master.hf;
                    var bIsSpecialPh = _ph_type === AscFormat.phType_dt || _ph_type === AscFormat.phType_ftr || _ph_type === AscFormat.phType_hdr || _ph_type === AscFormat.phType_sldNum;
                    if (!bIsSpecialPh || hf && ((_ph_type === AscFormat.phType_dt && (hf.dt !== false)) ||
                        (_ph_type === AscFormat.phType_ftr && (hf.ftr !== false)) ||
                        (_ph_type === AscFormat.phType_hdr && (hf.hdr !== false)) ||
                        (_ph_type === AscFormat.phType_sldNum && (hf.sldNum !== false)))) {
                        var matching_shape = slide.getMatchingShape(layout.cSld.spTree[j].getPlaceholderType(), layout.cSld.spTree[j].getPlaceholderIndex(), layout.cSld.spTree[j].getIsSingleBody ? layout.cSld.spTree[j].getIsSingleBody() : false);
                        if (matching_shape == null && layout.cSld.spTree[j]) {
                            var sp = layout.cSld.spTree[j].copy(undefined);
                            sp.setParent(slide);
                            !bIsSpecialPh && sp.clearContent && sp.clearContent();
                            slide.addToSpTreeToPos(slide.cSld.spTree.length, sp)
                        }
                    }
                }
            }
        }
        if (oSelectionStateState) {
            this.Slides[this.CurPage].graphicObjects.resetSelection();
            this.Slides[this.CurPage].graphicObjects.loadDocumentStateAfterLoadChanges(oSelectionStateState, this.CurPage);
        }
        this.Recalculate();
        this.Document_UpdateInterfaceState();
    }
};

CPresentation.prototype.clearThemeTimeouts = function () {
    if (this.startChangeThemeTimeOutId != null) {
        clearTimeout(this.startChangeThemeTimeOutId);
    }
    if (this.backChangeThemeTimeOutId != null) {
        clearTimeout(this.backChangeThemeTimeOutId);
    }
    if (this.forwardChangeThemeTimeOutId != null) {
        clearTimeout(this.forwardChangeThemeTimeOutId);
    }
};

CPresentation.prototype.changeTheme = function (themeInfo, arrInd) {
    if (this.viewMode === true) {
        return;
    }
    var arr_ind, i;
    if (!Array.isArray(arrInd)) {
        arr_ind = [];
        for (i = 0; i < this.Slides.length; ++i) {
            arr_ind.push(i);
        }
    } else {
        arr_ind = arrInd;
    }
    this.clearThemeTimeouts();

    for (i = 0; i < this.slideMasters.length; ++i) {
        if (this.slideMasters[i] === themeInfo.Master) {
            break;
        }
    }
    if (i === this.slideMasters.length) {
        this.addSlideMaster(this.slideMasters.length, themeInfo.Master);
    }
    var oldMaster = this.Slides[this.CurPage] && this.Slides[this.CurPage].Layout && this.Slides[this.CurPage].Layout.Master;
    var _new_master = themeInfo.Master;
    _new_master.presentation = this;
    themeInfo.Master.changeSize(this.Width, this.Height);
    var oContent, oMasterSp, oMasterContent, oSp;
    if (oldMaster && oldMaster.hf) {
        themeInfo.Master.setHF(oldMaster.hf.createDuplicate());
        if (oldMaster.hf.dt !== false) {
            oMasterSp = oldMaster.getMatchingShape(AscFormat.phType_dt, null, false, {});
            if (oMasterSp) {
                oMasterContent = oMasterSp.getDocContent && oMasterSp.getDocContent();
                if (oMasterContent) {
                    oSp = themeInfo.Master.getMatchingShape(AscFormat.phType_dt, null, false, {});
                    if (oSp) {
                        oContent = oSp.getDocContent && oSp.getDocContent();
                        oContent.Copy2(oMasterContent);
                    }
                    for (i = 0; i < themeInfo.Master.sldLayoutLst.length; ++i) {
                        oSp = themeInfo.Master.sldLayoutLst[i].getMatchingShape(AscFormat.phType_dt, null, false, {});
                        if (oSp) {
                            oContent = oSp.getDocContent && oSp.getDocContent();
                            oContent.Copy2(oMasterContent);
                        }
                    }
                }
            }
        }
        if (oldMaster.hf.hdr !== false) {
            oMasterSp = oldMaster.getMatchingShape(AscFormat.phType_hdr, null, false, {});
            if (oMasterSp) {
                oMasterContent = oMasterSp.getDocContent && oMasterSp.getDocContent();
                if (oMasterContent) {
                    oSp = themeInfo.Master.getMatchingShape(AscFormat.phType_hdr, null, false, {});
                    if (oSp) {
                        oContent = oSp.getDocContent && oSp.getDocContent();
                        oContent.Copy2(oMasterContent);
                    }
                    for (i = 0; i < themeInfo.Master.sldLayoutLst.length; ++i) {
                        oSp = themeInfo.Master.sldLayoutLst[i].getMatchingShape(AscFormat.phType_hdr, null, false, {});
                        if (oSp) {
                            oContent = oSp.getDocContent && oSp.getDocContent();
                            oContent.Copy2(oMasterContent);
                        }
                    }
                }
            }
        }
        if (oldMaster.hf.ftr !== false) {
            oMasterSp = oldMaster.getMatchingShape(AscFormat.phType_ftr, null, false, {});
            if (oMasterSp) {
                oMasterContent = oMasterSp.getDocContent && oMasterSp.getDocContent();
                if (oMasterContent) {
                    oSp = themeInfo.Master.getMatchingShape(AscFormat.phType_ftr, null, false, {});
                    if (oSp) {
                        oContent = oSp.getDocContent && oSp.getDocContent();
                        oContent.Copy2(oMasterContent);
                    }
                    for (i = 0; i < themeInfo.Master.sldLayoutLst.length; ++i) {
                        oSp = themeInfo.Master.sldLayoutLst[i].getMatchingShape(AscFormat.phType_ftr, null, false, {});
                        if (oSp) {
                            oContent = oSp.getDocContent && oSp.getDocContent();
                            oContent.Copy2(oMasterContent);
                        }
                    }
                }
            }
        }
    }
    for (i = 0; i < themeInfo.Master.sldLayoutLst.length; ++i) {
        themeInfo.Master.sldLayoutLst[i].changeSize(this.Width, this.Height);
    }
    var slides_array = [];
    for (i = 0; i < arr_ind.length; ++i) {
        slides_array.push(this.Slides[arr_ind[i]]);
    }
    var new_layout;
    for (i = 0; i < slides_array.length; ++i) {
        if (slides_array[i].Layout.calculatedType == null) {
            slides_array[i].Layout.calculateType();
        }
        new_layout = _new_master.getMatchingLayout(slides_array[i].Layout.type, slides_array[i].Layout.matchingName, slides_array[i].Layout.cSld.name, true);
        if (!isRealObject(new_layout)) {
            new_layout = _new_master.sldLayoutLst[0];
        }
        slides_array[i].setLayout(new_layout);
        slides_array[i].checkNoTransformPlaceholder();
    }
    History.Add(new AscDFH.CChangesDrawingChangeTheme(this, AscDFH.historyitem_Presentation_ChangeTheme, arr_ind));
    ///this.resetStateCurSlide();
    this.Recalculate();
    this.Document_UpdateInterfaceState();
};

CPresentation.prototype.changeSlideSizeFunction = function (width, height) {
    AscFormat.ExecuteNoHistory(function () {
        for (var i = 0; i < this.slideMasters.length; ++i) {
            this.slideMasters[i].changeSize(width, height);
            var master = this.slideMasters[i];
            for (var j = 0; j < master.sldLayoutLst.length; ++j) {
                master.sldLayoutLst[j].changeSize(width, height);
            }
        }
        for (var i = 0; i < this.Slides.length; ++i) {
            this.Slides[i].changeSize(width, height);
        }
    }, this, []);
};

CPresentation.prototype.changeSlideSize = function (width, height) {
    if (this.Document_Is_SelectionLocked(AscCommon.changestype_SlideSize) === false) {
        History.Create_NewPoint(AscDFH.historydescription_Presentation_ChangeSlideSize);
        History.Add(new AscDFH.CChangesDrawingsObjectNoId(this, AscDFH.historyitem_Presentation_SlideSize, new AscFormat.CDrawingBaseCoordsWritable(this.Width, this.Height), new AscFormat.CDrawingBaseCoordsWritable(width, height)));
        this.Width = width;
        this.Height = height;
        this.changeSlideSizeFunction(this.Width, this.Height);
        this.Recalculate();
        this.Document_UpdateInterfaceState();
    }
};

CPresentation.prototype.changeColorScheme = function (colorScheme) {
    if (this.viewMode === true) {
        return;
    }

    if (!(this.Document_Is_SelectionLocked(AscCommon.changestype_Theme) === false))
        return;

    if (!(colorScheme instanceof AscFormat.ClrScheme)) {
        return;
    }
    History.Create_NewPoint(AscDFH.historydescription_Presentation_ChangeColorScheme);

    var arrInd = [];
    for (var i = 0; i < this.Slides.length; ++i) {
        if (!this.Slides[i].Layout.Master.Theme.themeElements.clrScheme.isIdentical(colorScheme)) {
            this.Slides[i].Layout.Master.Theme.changeColorScheme(colorScheme.createDuplicate());
        }
        arrInd.push(i);
    }
    History.Add(new AscDFH.CChangesDrawingChangeTheme(this, AscDFH.historyitem_Presentation_ChangeColorScheme, arrInd));
    this.Recalculate();
    this.Document_UpdateInterfaceState();
};

CPresentation.prototype.removeSlide = function (pos) {
    if (AscFormat.isRealNumber(pos) && pos > -1 && pos < this.Slides.length) {
        History.Add(new AscDFH.CChangesDrawingsContentPresentation(this, AscDFH.historyitem_Presentation_RemoveSlide, pos, [this.Slides[pos]], false));
        var aSlideComments = this.Slides[pos] && this.Slides[pos].slideComments && this.Slides[pos].slideComments.comments;
        editor.sync_HideComment();
        if (Array.isArray(aSlideComments)) {
            for (var i = aSlideComments.length - 1; i > -1; --i) {
                var sId = aSlideComments[i].Id;
                this.Slides[i].removeComment(sId);
            }
        }
        return this.Slides.splice(pos, 1)[0];
    }
    return null;
};

CPresentation.prototype.insertSlide = function (pos, slide) {
    History.Add(new AscDFH.CChangesDrawingsContentPresentation(this, AscDFH.historyitem_Presentation_AddSlide, pos, [slide], true));
    this.Slides.splice(pos, 0, slide);
    var aSlideComments = slide.slideComments.comments;
    for (var i = 0; i < aSlideComments.length; ++i) {
        editor.sync_AddComment(aSlideComments[i].Get_Id(), aSlideComments[i].Data);
    }
};

CPresentation.prototype.moveSlides = function (slidesIndexes, pos) {
    var insert_pos = pos;
    var removed_slides = [];
    for (var i = slidesIndexes.length - 1; i > -1; --i) {
        removed_slides.push(this.removeSlide(slidesIndexes[i]));
        if (slidesIndexes[i] < pos) {
            --insert_pos;
        }
    }
    removed_slides.reverse();
    for (i = 0; i < removed_slides.length; ++i) {
        this.insertSlide(insert_pos + i, removed_slides[i]);
    }
    this.Recalculate();
    this.DrawingDocument.UpdateThumbnailsAttack();
};
//-----------------------------------------------------------------------------------
// Функции для работы с совместным редактирования
//-----------------------------------------------------------------------------------

CPresentation.prototype.Document_Is_SelectionLocked = function (CheckType, AdditionalData, isIgnoreCanEditFlag, aAdditionaObjects) {
    if (!this.CanEdit() && true !== isIgnoreCanEditFlag)
        return true;

    if (true === AscCommon.CollaborativeEditing.Get_GlobalLock())
        return true;
    if (this.Slides.length === 0)
        return false;
    if (AscCommon.changestype_Document_SectPr === CheckType) {
        return true;
    }

    if (CheckType === AscCommon.changestype_None && AscCommon.isRealObject(AdditionalData) && AdditionalData.CheckType === AscCommon.changestype_Table_Properties) {
        CheckType = AscCommon.changestype_Drawing_Props;
    }


    var cur_slide = this.Slides[this.CurPage];
    var slide_id;
    if (this.FocusOnNotes && cur_slide.notes) {
        slide_id = cur_slide.notes.Get_Id();
    } else {
        slide_id = cur_slide.deleteLock.Get_Id();
    }

    AscCommon.CollaborativeEditing.OnStart_CheckLock();

    var oController = this.GetCurrentController();
    if (!oController) {
        return false;
    }

    if (CheckType === AscCommon.changestype_Paragraph_Content || CheckType === AscCommon.changestype_Paragraph_TextProperties) {
        var oTargetTextObject = oController.getTargetDocContent(false, true);
        if (oTargetTextObject) {
            CheckType = AscCommon.changestype_Drawing_Props;
        } else {
            return false;
        }
    }

    if (CheckType === AscCommon.changestype_Drawing_Props) {
        if (cur_slide.deleteLock.Lock.Type !== AscCommon.locktype_Mine && cur_slide.deleteLock.Lock.Type !== AscCommon.locktype_None)
            return true;
        var selected_objects = oController.selectedObjects;
        for (var i = 0; i < selected_objects.length; ++i) {
            var check_obj =
                {
                    "type": c_oAscLockTypeElemPresentation.Object,
                    "slideId": slide_id,
                    "objId": selected_objects[i].Get_Id(),
                    "guid": selected_objects[i].Get_Id()
                };
            selected_objects[i].Lock.Check(check_obj);
        }
        if (Array.isArray(aAdditionaObjects)) {
            for (var i = 0; i < aAdditionaObjects.length; ++i) {
                var check_obj =
                    {
                        "type": c_oAscLockTypeElemPresentation.Object,
                        "slideId": slide_id,
                        "objId": aAdditionaObjects[i].Get_Id(),
                        "guid": aAdditionaObjects[i].Get_Id()
                    };
                aAdditionaObjects[i].Lock.Check(check_obj);
            }
        }
    }

    if (CheckType === AscCommon.changestype_AddShape || CheckType === AscCommon.changestype_AddComment) {

        if (CheckType === AscCommon.changestype_AddComment && AdditionalData && AdditionalData.Parent === this.comments) {
            var check_obj =
                {
                    "type": c_oAscLockTypeElemPresentation.Slide,
                    "val": this.commentsLock.Get_Id(),
                    "guid": this.commentsLock.Get_Id()
                };
            this.commentsLock.Lock.Check(check_obj);
        } else {
            if (cur_slide.deleteLock.Lock.Type !== AscCommon.locktype_Mine && cur_slide.deleteLock.Lock.Type !== AscCommon.locktype_None)
                return true;
            var check_obj =
                {
                    "type": c_oAscLockTypeElemPresentation.Object,
                    "slideId": slide_id,
                    "objId": AdditionalData.Get_Id(),
                    "guid": AdditionalData.Get_Id()
                };
            AdditionalData.Lock.Check(check_obj);
        }
    }
    if (CheckType === AscCommon.changestype_AddShapes) {
        if (cur_slide.deleteLock.Lock.Type !== AscCommon.locktype_Mine && cur_slide.deleteLock.Lock.Type !== AscCommon.locktype_None)
            return true;
        for (var i = 0; i < AdditionalData.length; ++i) {
            var check_obj =
                {
                    "type": c_oAscLockTypeElemPresentation.Object,
                    "slideId": slide_id,
                    "objId": AdditionalData[i].Get_Id(),
                    "guid": AdditionalData[i].Get_Id()
                };
            AdditionalData[i].Lock.Check(check_obj);
        }
    }

    if (CheckType === AscCommon.changestype_MoveComment) {
        if (Array.isArray(AdditionalData)) {
            for (var i = 0; i < AdditionalData.length; ++i) {
                var oCheckData = AdditionalData[i];
                if (oCheckData.slide) {
                    if (oCheckData.slide.deleteLock.Lock.Type !== AscCommon.locktype_Mine && oCheckData.slide.deleteLock.Lock.Type !== AscCommon.locktype_None)
                        return true;
                    var check_obj =
                        {
                            "type": c_oAscLockTypeElemPresentation.Object,
                            "slideId": slide_id,
                            "objId": oCheckData.comment.Get_Id(),
                            "guid": oCheckData.comment.Get_Id()
                        };
                    oCheckData.comment.Lock.Check(check_obj);
                } else {
                    var check_obj =
                        {
                            "type": c_oAscLockTypeElemPresentation.Slide,
                            "val": this.commentsLock.Get_Id(),
                            "guid": this.commentsLock.Get_Id()
                        };
                    this.commentsLock.Lock.Check(check_obj);
                }
            }
        }
    }

    if (CheckType === AscCommon.changestype_SlideBg) {
        var selected_slides = this.GetSelectedSlides();
        for (var i = 0; i < selected_slides.length; ++i) {
            var check_obj =
                {
                    "type": c_oAscLockTypeElemPresentation.Slide,
                    "val": this.Slides[selected_slides[i]].backgroundLock.Get_Id(),
                    "guid": this.Slides[selected_slides[i]].backgroundLock.Get_Id()
                };
            this.Slides[selected_slides[i]].backgroundLock.Lock.Check(check_obj);
        }
    }
    if (CheckType === AscCommon.changestype_SlideHide) {
        var selected_slides = AdditionalData;
        for (var i = 0; i < selected_slides.length; ++i) {
            var check_obj =
                {
                    "type": c_oAscLockTypeElemPresentation.Slide,
                    "val": this.Slides[selected_slides[i]].showLock.Get_Id(),
                    "guid": this.Slides[selected_slides[i]].showLock.Get_Id()
                };
            this.Slides[selected_slides[i]].showLock.Lock.Check(check_obj);
        }
    }

    if (CheckType === AscCommon.changestype_CorePr) {
        if (this.Core) {
            this.Core.Lock.Check(
                {
                    "type": c_oAscLockTypeElemPresentation.Object,
                    "val": this.Core.Get_Id(),
                    "guid": this.Core.Get_Id(),
                    "objId": this.Core.Get_Id()
                });
        }
    }

    if (CheckType === AscCommon.changestype_SlideTiming) {
        if (!AdditionalData || !AdditionalData.All) {
            var aSelectedSlides = this.GetSelectedSlides();
            for (var i = 0; i < aSelectedSlides.length; ++i) {
                var check_obj =
                    {
                        "type": c_oAscLockTypeElemPresentation.Slide,
                        "val": this.Slides[this.CurPage].timingLock.Get_Id(),
                        "guid": this.Slides[this.CurPage].timingLock.Get_Id()
                    };
                this.Slides[aSelectedSlides[i]].timingLock.Lock.Check(check_obj);
            }
        } else {
            for (var i = 0; i < this.Slides.length; ++i) {
                var check_obj =
                    {
                        "type": c_oAscLockTypeElemPresentation.Slide,
                        "val": this.Slides[i].timingLock.Get_Id(),
                        "guid": this.Slides[i].timingLock.Get_Id()
                    };
                this.Slides[i].timingLock.Lock.Check(check_obj);
            }
        }

    }

    if (CheckType === AscCommon.changestype_Text_Props) {
        if (cur_slide.deleteLock.Lock.Type !== AscCommon.locktype_Mine && cur_slide.deleteLock.Lock.Type !== AscCommon.locktype_None)
            return true;
        var selected_objects = oController.selectedObjects;
        for (var i = 0; i < selected_objects.length; ++i) {
            var check_obj =
                {
                    "type": c_oAscLockTypeElemPresentation.Object,
                    "slideId": slide_id,
                    "objId": selected_objects[i].Get_Id(),
                    "guid": selected_objects[i].Get_Id()
                };
            selected_objects[i].Lock.Check(check_obj);
        }
    }

    if (CheckType === AscCommon.changestype_RemoveSlide) {
        var selected_slides = AdditionalData;
        for (var i = 0; i < selected_slides.length; ++i) {
            if (this.Slides[selected_slides[i]].isLockedObject())
                return true;
        }
        for (var i = 0; i < selected_slides.length; ++i) {
            var check_obj =
                {
                    "type": c_oAscLockTypeElemPresentation.Slide,
                    "val": this.Slides[selected_slides[i]].deleteLock.Get_Id(),
                    "guid": this.Slides[selected_slides[i]].deleteLock.Get_Id()
                };
            this.Slides[selected_slides[i]].deleteLock.Lock.Check(check_obj);
        }
    }

    if (CheckType === AscCommon.changestype_Theme) {
        var check_obj =
            {
                "type": c_oAscLockTypeElemPresentation.Slide,
                "val": this.themeLock.Get_Id(),
                "guid": this.themeLock.Get_Id()
            };
        this.themeLock.Lock.Check(check_obj);
    }

    if (CheckType === AscCommon.changestype_Layout) {
        var selected_slides = this.GetSelectedSlides();
        for (var i = 0; i < selected_slides.length; ++i) {
            var check_obj =
                {
                    "type": c_oAscLockTypeElemPresentation.Slide,
                    "val": this.Slides[selected_slides[i]].layoutLock.Get_Id(),
                    "guid": this.Slides[selected_slides[i]].layoutLock.Get_Id()
                };
            this.Slides[selected_slides[i]].layoutLock.Lock.Check(check_obj);
        }
    }
    if (CheckType === AscCommon.changestype_ColorScheme) {
        var check_obj =
            {
                "type": c_oAscLockTypeElemPresentation.Slide,
                "val": this.schemeLock.Get_Id(),
                "guid": this.schemeLock.Get_Id()
            };
        this.schemeLock.Lock.Check(check_obj);
    }

    if (CheckType === AscCommon.changestype_SlideSize) {
        var check_obj =
            {
                "type": c_oAscLockTypeElemPresentation.Slide,
                "val": this.slideSizeLock.Get_Id(),
                "guid": this.slideSizeLock.Get_Id()
            };
        this.slideSizeLock.Lock.Check(check_obj);
    }

    if (CheckType === AscCommon.changestype_PresDefaultLang) {
        var check_obj =
            {
                "type": c_oAscLockTypeElemPresentation.Slide,
                "val": this.defaultTextStyleLock.Get_Id(),
                "guid": this.defaultTextStyleLock.Get_Id()
            };

        this.defaultTextStyleLock.Lock.Check(check_obj);
    }

    var bResult = AscCommon.CollaborativeEditing.OnEnd_CheckLock();

    if (true === bResult) {
        this.Document_UpdateSelectionState();
        this.Document_UpdateInterfaceState();
    }

    return bResult;
};

CPresentation.prototype.Clear_CollaborativeMarks = function () {
};


CPresentation.prototype.Load_Comments = function (authors) {
    AscCommonSlide.fLoadComments(this, authors);
};

//-----------------------------------------------------------------------------------
// Функции для работы с комментариями
//-----------------------------------------------------------------------------------

CPresentation.prototype.addComment = function (comment) {
    if (AscCommon.isRealObject(this.comments)) {
        this.comments.addComment(comment);
    }
};


CPresentation.prototype.AddComment = function (CommentData, bAll) {
    var oSlideComments = bAll ? this.comments : (this.Slides[this.CurPage] ? this.Slides[this.CurPage].slideComments : null);
    if (oSlideComments) {
        History.Create_NewPoint(AscDFH.historydescription_Presentation_AddComment);
        var Comment = new AscCommon.CComment(oSlideComments, CommentData);
        if (this.Document_Is_SelectionLocked(AscCommon.changestype_AddComment, Comment, this.IsEditCommentsMode()) === false) {
            if (!bAll) {
                var slide = this.Slides[this.CurPage];
                Comment.selected = true;
                var selected_objects = slide.graphicObjects.selection.groupSelection ? slide.graphicObjects.selection.groupSelection.selectedObjects : slide.graphicObjects.selectedObjects;
                if (selected_objects.length > 0) {
                    var last_object = selected_objects[selected_objects.length - 1];
                    Comment.setPosition(last_object.x + last_object.extX, last_object.y);
                } else {
                    Comment.setPosition(this.Slides[this.CurPage].commentX, this.Slides[this.CurPage].commentY);
                }
                var Flags = 0;
                var dd = editor.WordControl.m_oDrawingDocument;
                var W = dd.GetCommentWidth(Flags);
                var H = dd.GetCommentHeight(Flags);
                this.Slides[this.CurPage].commentX += W;
                this.Slides[this.CurPage].commentY += H;
                for (var i = this.Slides[this.CurPage].slideComments.comments.length - 1; i > -1; --i) {
                    this.Slides[this.CurPage].slideComments.comments[i].selected = false;
                }
            }
            oSlideComments.addComment(Comment);
            CommentData.bDocument = bAll;
            editor.sync_AddComment(Comment.Get_Id(), CommentData);
            if (!bAll) {
                this.DrawingDocument.OnRecalculatePage(this.CurPage, this.Slides[this.CurPage]);
                this.DrawingDocument.OnEndRecalculate();
                var Coords = editor.WordControl.m_oDrawingDocument.ConvertCoordsToCursorWR_Comment(Comment.x, Comment.y, this.CurPage);
                editor.sync_HideComment();
                editor.sync_ShowComment(Comment.Id, Coords.X, Coords.Y);
            }

            this.Document_UpdateInterfaceState();
            return Comment;
        } else {
            this.Document_Undo();
        }
    }
};

CPresentation.prototype.EditComment = function (Id, CommentData) {
    var comment = g_oTableId.Get_ById(Id);
    if (!comment) {
        return;
    }
    var oComments = comment.Parent;
    if (!oComments) {
        return;
    }
    var bPresComments = (oComments === this.comments);
    var nCheckType = AscCommon.changestype_MoveComment;
    if (this.Document_Is_SelectionLocked(nCheckType, [{
        comment: comment,
        slide: bPresComments ? null : oComments.slide
    }], this.IsEditCommentsMode()) === false) {
        History.Create_NewPoint(AscDFH.historydescription_Presentation_ChangeComment);
        if (!bPresComments) {
            if (AscCommon.isRealObject(oComments.slide)) {
                if (oComments.slide.num !== this.CurPage) {
                    this.DrawingDocument.m_oWordControl.GoToPage(oComments.slide.num);
                }
                oComments.changeComment(Id, CommentData);
                editor.sync_ChangeCommentData(Id, CommentData);
                this.Recalculate()
            } else {
                return true;
            }
        } else {
            oComments.changeComment(Id, CommentData);
            editor.sync_ChangeCommentData(Id, CommentData);
        }
        this.Document_UpdateInterfaceState();
    }
};

CPresentation.prototype.RemoveComment = function (Id, bSendEvent) {
    if (null === Id)
        return;

    for (var i = 0; i < this.Slides.length; ++i) {
        var comments = this.Slides[i].slideComments.comments;
        for (var j = 0; j < comments.length; ++j) {
            if (comments[j].Id === Id) {
                this.Slides[i].removeComment(Id);
                this.Recalculate();
                if (this.CurPage !== i) {
                    this.DrawingDocument.m_oWordControl.GoToPage(i);
                }
                return;
            }
        }
    }
    this.comments.removeComment(Id);
    editor.sync_HideComment();
};

CPresentation.prototype.CanAddComment = function () {
    if (!this.CanEdit() && !this.IsEditCommentsMode())
        return false;
    return true;
};

CPresentation.prototype.SelectComment = function (Id) {

};


CPresentation.prototype.GetCommentIdByGuid = function (sGuid) {
    for (var i = 0; i < this.Slides.length; ++i) {
        var comments = this.Slides[i].slideComments.comments;
        for (var j = 0; j < comments.length; ++j) {
            var oComment = comments[j];
            var oData = oComment.Data;
            if (oData) {
                if (oData.m_sGuid === sGuid) {
                    return oComment.Id;
                }
                for (var t = 0; t < oData.m_aReplies.length; ++t) {
                    if (oData.m_aReplies[t].m_sGuid === sGuid) {
                        return oComment.Id;
                    }
                }
            }
        }
    }
    return null;
};


CPresentation.prototype.ShowComment = function (Id) {

    for (var i = 0; i < this.Slides.length; ++i) {
        var comments = this.Slides[i].slideComments.comments;
        for (var j = 0; j < comments.length; ++j) {
            if (comments[j].Id === Id) {
                //this.Set_CurPage(i);
                if (this.CurPage !== i) {
                    this.DrawingDocument.m_oWordControl.GoToPage(i);
                }

                var Coords = this.DrawingDocument.ConvertCoordsToCursorWR_Comment(comments[j].x, comments[j].y, i);
                this.Slides[i].showComment(Id, Coords.X, Coords.Y);
                return;
            }
        }
    }
    editor.sync_HideComment();
};

CPresentation.prototype.ShowComments = function () {
};

CPresentation.prototype.HideComments = function () {
    //this.Slides[this.CurPage].graphicObjects.hideComment();
};
//-----------------------------------------------------------------------------------
// Функции для работы с textbox
//-----------------------------------------------------------------------------------
CPresentation.prototype.TextBox_Put = function (sText, rFonts) {
    if (true === this.CollaborativeEditing.Is_Fast() || this.Document_Is_SelectionLocked(changestype_Drawing_Props) === false) {
        History.Create_NewPoint(AscDFH.historydescription_Presentation_ParagraphAdd);
        if (!rFonts) {

            // Отключаем пересчет, включим перед последним добавлением. Поскольку,
            // у нас все добавляется в 1 параграф, так можно делать.
            this.TurnOffRecalc = true;

            for (var oIterator = sText.getUnicodeIterator(); oIterator.check(); oIterator.next()) {

                var nCharCode = oIterator.value();
                if (0x0020 === nCharCode)
                    this.AddToParagraph(new ParaSpace());
                else
                    this.AddToParagraph(new ParaText(nCharCode));

            }

            this.TurnOffRecalc = false;
            this.Recalculate();
        } else {
            var oController = this.GetCurrentController();
            if (oController) {
                oController.CreateDocContent();
                var oTargetContent = oController.getTargetDocContent(true);
                if (oTargetContent) {
                    var Para = oTargetContent.GetCurrentParagraph();
                    if (null === Para)
                        return;

                    var RunPr = Para.Get_TextPr();
                    if (null === RunPr || undefined === RunPr)
                        RunPr = new CTextPr();

                    RunPr.RFonts = rFonts;

                    var Run = new ParaRun(Para);
                    Run.Set_Pr(RunPr);
                    Run.AddText(sText);
                    Para.Add(Run);
                }
                oController.startRecalculate();
            }
        }
    }
    this.Document_UpdateUndoRedoState();
};


CPresentation.prototype.AddShapeOnCurrentPage = function (sPreset) {

    if (!this.Slides[this.CurPage]) {
        return;
    }
    var oDrawingObjects = this.Slides[this.CurPage].graphicObjects;
    oDrawingObjects.changeCurrentState(new AscFormat.StartAddNewShape(oDrawingObjects, sPreset));
    this.OnMouseDown({}, this.Width / 4, this.Height / 4, this.CurPage);
    this.OnMouseUp({}, this.Width / 4, this.Height / 4, this.CurPage);
    this.Document_UpdateInterfaceState();
    this.Document_UpdateRulersState();
    this.Document_UpdateSelectionState();
};

CPresentation.prototype.Can_CopyCut = function () {
    var oController = this.GetCurrentController();
    if (!oController) {
        return false;
    }
    var oTargetContent = oController.getTargetDocContent();


    if (oTargetContent) {
        if (true === oTargetContent.IsSelectionUse() && true !== oTargetContent.IsSelectionEmpty(true)) {
            if (oTargetContent.Selection.StartPos !== oTargetContent.Selection.EndPos || type_Paragraph === oTargetContent.Content[oTargetContent.Selection.StartPos].Get_Type())
                return true;
            else
                return oTargetContent.Content[oTargetContent.Selection.StartPos].Can_CopyCut();
        }
        return false;
    } else {
        return oController.selectedObjects.length > 0;
    }
};

CPresentation.prototype.AddToLayout = function () {
    if (this.FocusOnNotes) {
        return;
    }
    var oSlide = this.Slides[this.CurPage];
    if (!oSlide) {
        return;
    }
    var oController = oSlide.graphicObjects;
    var oPresentation = this;
    oController.checkSelectedObjectsAndCallback(function () {
        var oSelectionState = oPresentation.Get_SelectionState2();
        var spTree = oSlide.cSld.spTree;
        var oLayout = oSlide.Layout;
        var k = 0;
        for (var i = spTree.length - 1; i > -1; i--) {
            var oSp = spTree[i];
            if (spTree[i].selected && !spTree[i].isPlaceholder()) {
                oSlide.removeFromSpTreeByPos(i);
                oSp.setParent(oLayout);
                oLayout.shapeAdd(oLayout.cSld.spTree.length - k, oSp);
                ++k;
            }
        }
        oPresentation.Set_SelectionState2(oSelectionState);
    }, [], false, AscDFH.historydescription_Presentation_AddToLayout);
};

CPresentation.prototype.StartAddShape = function (preset, _is_apply) {
    if (this.Slides[this.CurPage]) {
        if (!(_is_apply === false)) {
            this.FocusOnNotes = false;
            editor.WordControl.Thumbnails && editor.WordControl.Thumbnails.SetFocusElement(FOCUS_OBJECT_MAIN);
            editor.sync_HideComment();
            this.Slides[this.CurPage].graphicObjects.startTrackNewShape(preset);
        } else {
            this.Slides[this.CurPage].graphicObjects.clearTrackObjects();
            this.Slides[this.CurPage].graphicObjects.clearPreTrackObjects();
            // this.Slides[this.CurPage].graphicObjects.resetSelectionState();

            this.Slides[this.CurPage].graphicObjects.changeCurrentState(new AscFormat.NullState(this.Slides[this.CurPage].graphicObjects));
            this.DrawingDocument.m_oWordControl.OnUpdateOverlay();
            editor.sync_EndAddShape();
        }
    }
};


CPresentation.prototype.canStartImageCrop = function () {
    var oCurrentController = this.GetCurrentController();
    if (!oCurrentController) {
        return false;
    }
    return oCurrentController.canStartImageCrop();
};

CPresentation.prototype.startImageCrop = function () {
    var oCurrentController = this.GetCurrentController();
    if (!oCurrentController) {
        return false;
    }
    return oCurrentController.startImageCrop();
};

CPresentation.prototype.endImageCrop = function () {
    var oCurrentController = this.GetCurrentController();
    if (!oCurrentController) {
        return false;
    }
    return oCurrentController.endImageCrop();
};


CPresentation.prototype.cropFit = function () {
    var oCurrentController = this.GetCurrentController();
    if (!oCurrentController) {
        return false;
    }
    return oCurrentController.cropFit();
};

CPresentation.prototype.cropFill = function () {
    var oCurrentController = this.GetCurrentController();
    if (!oCurrentController) {
        return false;
    }
    return oCurrentController.cropFill();
};

CPresentation.prototype.FitImagesToSlide = function () {
    var oCurrentController = this.GetCurrentController();
    if (!oCurrentController) {
        return;
    }
    oCurrentController.fitImagesToSlide();
};


/**
 * Добавляем текст в текущую позицию с заданными текстовыми настройками
 * @param sText {string}
 * @param oTextPr {?CTextPr}
 * @param isMoveCursorOutside {boolean} выводим ли курсор за пределы нового рана
 */
CPresentation.prototype.AddTextWithPr = function(sText, oTextPr, isMoveCursorOutside)
{
    var oCurrentController = this.GetCurrentController();
    if (!oCurrentController) {
        return;
    }
    oCurrentController.addTextWithPr(sText, oTextPr, isMoveCursorOutside);
};

CPresentation.prototype.AddTextArt = function (nStyle) {
    if (this.Slides[this.CurPage]) {
        var oDrawingObjects = this.Slides[this.CurPage].graphicObjects;
        if (oDrawingObjects.curState instanceof AscFormat.StartAddNewShape
            || oDrawingObjects.curState instanceof AscFormat.SplineBezierState
            || oDrawingObjects.curState instanceof AscFormat.PolyLineAddState
            || oDrawingObjects.curState instanceof AscFormat.AddPolyLine2State
            || oDrawingObjects.arrTrackObjects.length > 0) {
            oDrawingObjects.changeCurrentState(new AscFormat.NullState(oDrawingObjects));
            if (oDrawingObjects.arrTrackObjects.length > 0) {
                oDrawingObjects.clearTrackObjects();
                oDrawingObjects.updateOverlay();
            }
            editor.sync_EndAddShape();
        }

        editor.WordControl.Thumbnails && editor.WordControl.Thumbnails.SetFocusElement(FOCUS_OBJECT_MAIN);

        History.Create_NewPoint(AscDFH.historydescription_Document_AddTextArt);
        var oTextArt = this.Slides[this.CurPage].graphicObjects.createTextArt(nStyle, false);
        oTextArt.addToDrawingObjects();
        oTextArt.checkExtentsByDocContent();
        oTextArt.spPr.xfrm.setOffX((this.Slides[this.CurPage].Width - oTextArt.spPr.xfrm.extX) / 2);
        oTextArt.spPr.xfrm.setOffY((this.Slides[this.CurPage].Height - oTextArt.spPr.xfrm.extY) / 2);
        this.Slides[this.CurPage].graphicObjects.resetSelection();

        if (oTextArt.bSelectedText) {
            this.Slides[this.CurPage].graphicObjects.selectObject(oTextArt, 0);
        } else {
            var oContent = oTextArt.getDocContent();
            oContent.Content[0].Document_SetThisElementCurrent(false);
            this.SelectAll();
        }
        this.Recalculate();
        this.Document_UpdateInterfaceState();
    }
};


CPresentation.prototype.AddSignatureLine = function (sGuid, sSigner, sSigner2, sEmail, Width, Height, sImgUrl) {
    if (this.Slides[this.CurPage]) {
        History.Create_NewPoint(AscDFH.historydescription_Document_InsertSignatureLine);
        var fPosX = (this.Width - Width) / 2;
        var fPosY = (this.Height - Height) / 2;
        var oController = this.Slides[this.CurPage].graphicObjects;
        var Image = AscFormat.fCreateSignatureShape(sGuid, sSigner, sSigner2, sEmail, false, null, Width, Height, sImgUrl);
        Image.spPr.xfrm.setOffX(fPosX);
        Image.spPr.xfrm.setOffY(fPosY);
        Image.setParent(this.Slides[this.CurPage]);
        Image.addToDrawingObjects();
        oController.resetSelection();
        oController.selectObject(Image, 0);
        this.Recalculate();
        this.Document_UpdateInterfaceState();
        this.Api.sendEvent("asc_onAddSignature", sGuid);
    }
};

CPresentation.prototype.GetAllSignatures = function () {
    var ret = [];
    for (var i = 0; i < this.Slides.length; ++i) {
        var oController = this.Slides[i].graphicObjects;
        oController.getAllSignatures2(ret, oController.getDrawingArray());
    }
    return ret;
};

CPresentation.prototype.CallSignatureDblClickEvent = function (sGuid) {
    var ret = [], allSpr = [];
    for (var i = 0; i < this.Slides.length; ++i) {
        var oController = this.Slides[i].graphicObjects;
        allSpr = allSpr.concat(oController.getAllSignatures2(ret, oController.getDrawingArray()));
    }
    for (i = 0; i < allSpr.length; ++i) {
        if (allSpr[i].signatureLine && allSpr[i].signatureLine.id === sGuid) {
            this.Api.sendEvent("asc_onSignatureDblClick", sGuid, allSpr[i].extX, allSpr[i].extY);
        }
    }
};

CPresentation.prototype.internalCalculateData = function (aSlideComments, aWriteComments, oData) {
    aWriteComments.length = 0;

    var _comments = aSlideComments;
    var _commentsCount = _comments.length;
    var _uniIdSplitter = ";__teamlab__;";
    for (var i = 0; i < _commentsCount; i++) {
        var _data = _comments[i].Data;
        var _commId = 0;

        var _autID = _data.m_sUserName;
        var _author = this.CommentAuthors[_autID];
        if (!_author) {
            this.CommentAuthors[_autID] = new AscCommon.CCommentAuthor();
            _author = this.CommentAuthors[_autID];
            _author.Name = _data.m_sUserName;
            _author.Calculate();

            oData._AuthorId++;
            _author.Id = oData._AuthorId;
        }

        _author.LastId++;
        _commId = _author.LastId;

        var _new_data = new AscCommon.CWriteCommentData();
        _new_data.Data = _data;
        _new_data.WriteAuthorId = _author.Id;
        _new_data.WriteCommentId = _commId;
        _new_data.WriteParentAuthorId = 0;
        _new_data.WriteParentCommentId = 0;
        _new_data.x = _comments[i].x;
        _new_data.y = _comments[i].y;

        _new_data.Calculate();
        aWriteComments.push(_new_data);

        var _comments2 = _data.m_aReplies;
        var _commentsCount2 = _comments2.length;

        for (var j = 0; j < _commentsCount2; j++) {
            var _data2 = _comments2[j];

            var _autID2 = _data2.m_sUserName;
            var _author2 = this.CommentAuthors[_autID2];
            if (!_author2) {
                this.CommentAuthors[_autID2] = new AscCommon.CCommentAuthor();
                _author2 = this.CommentAuthors[_autID2];
                _author2.Name = _data2.m_sUserName;
                _author2.Calculate();

                oData._AuthorId++;
                _author2.Id = oData._AuthorId;
            }

            _author2.LastId++;

            var _new_data2 = new AscCommon.CWriteCommentData();
            _new_data2.Data = _data2;
            _new_data2.WriteAuthorId = _author2.Id;
            _new_data2.WriteCommentId = _author2.LastId;
            _new_data2.WriteParentAuthorId = _author.Id;
            _new_data2.WriteParentCommentId = _commId;
            _new_data2.x = _new_data.x;
            _new_data2.y = _new_data.y + 136 * (j + 1); // так уж делает микрософт
            _new_data2.Calculate();
            aWriteComments.push(_new_data2);
        }
    }
};

CPresentation.prototype.CalculateComments = function () {
    this.CommentAuthors = {};
    var oData = {_AuthorId: 0};
    this.internalCalculateData(this.comments.comments, this.writecomments, oData);
    var _slidesCount = this.Slides.length;
    for (var _sldIdx = 0; _sldIdx < _slidesCount; _sldIdx++) {
        this.Slides[_sldIdx].writecomments = [];
        this.internalCalculateData(this.Slides[_sldIdx].slideComments.comments, this.Slides[_sldIdx].writecomments, oData);
    }
};

CPresentation.prototype.IsTrackRevisions = function () {
    return false;
};
CPresentation.prototype.IsViewModeInReview = function () {
    return false;
};
CPresentation.prototype.StartAction = function (nDescription) {
    this.Create_NewHistoryPoint(nDescription);
};
CPresentation.prototype.FinalizeAction = function () {
    this.Recalculate();
};

CPresentation.prototype.IsSplitPageBreakAndParaMark = function() {
	return false;
};
CPresentation.prototype.IsDoNotExpandShiftReturn = function() {
	return false;
};


CPresentation.prototype.IsActionInProgress = function () {
};
/**
 * Сообщаем документу, что потребуется пересчет
 */
CPresentation.prototype.Recalculate2 = function () {
    this.Recalculate();
};
/**
 * Сообщаем документу, что потребуется обновить состояние селекта
 */
CPresentation.prototype.UpdateSelection = function () {
    this.Document_UpdateSelectionState();
};
/**
 * Сообщаем документу, что потребуется обновить состояние интерфейса
 */
CPresentation.prototype.UpdateInterface = function () {
    this.Document_UpdateInterfaceState();
};
/**
 * Сообщаем документу, что потребуется обновить линейки
 */
CPresentation.prototype.UpdateRulers = function () {
    this.Document_UpdateRulersState();
};
/**
 * Сообщаем документу, что потребуется обновить состояние кнопки Unddo/Redo
 */
CPresentation.prototype.UpdateUndoRedo = function () {
    this.Document_UpdateUndoRedoState();
};

function collectSelectedObjects(aSpTree, aCollectArray, bRecursive, oIdMap, bSourceFormatting) {
    var oSp;
    var oPr = new AscFormat.CCopyObjectProperties();
    oPr.idMap = oIdMap;
    oPr.bSaveSourceFormatting = bSourceFormatting;
    for (var i = 0; i < aSpTree.length; ++i) {
        oSp = aSpTree[i];
        // if(oSp.isEmptyPlaceholder())
        // {
        //     continue;
        // }
        if (oSp.selected) {
            var oCopy;
            if (oSp.getObjectType() === AscDFH.historyitem_type_GroupShape) {
                oCopy = oSp.copy(oPr);
                oCopy.setParent(oSp.parent);
            } else {
                if (!bSourceFormatting) {
                    oCopy = oSp.copy(oPr);
                    oCopy.setParent(oSp.parent);
                    if (oSp.isPlaceholder && oSp.isPlaceholder()) {
                        oCopy.x = oSp.x;
                        oCopy.y = oSp.y;
                        oCopy.extX = oSp.extX;
                        oCopy.extY = oSp.extY;
                        oCopy.rot = oSp.rot;
                        AscFormat.CheckSpPrXfrm(oCopy, true);
                    }
                } else {
                    oCopy = oSp.getCopyWithSourceFormatting();
                    oCopy.setParent(oSp.parent);
                }

            }

            aCollectArray.push(new DrawingCopyObject(oCopy, oSp.x, oSp.y, oSp.extX, oSp.extY, oSp.getBase64Img()));
            if (AscCommon.isRealObject(oIdMap)) {
                oIdMap[oSp.Id] = oCopy.Id;
            }
        }
        if (bRecursive && oSp.getObjectType() === AscDFH.historyitem_type_GroupShape) {
            collectSelectedObjects(oSp.spTree, aCollectArray, bRecursive, oIdMap, bSourceFormatting);
        }
    }
}

//------------------------------------------------------------export----------------------------------------------------
window['AscCommonSlide'] = window['AscCommonSlide'] || {};
window['AscCommonSlide'].CPresentation = CPresentation;
window['AscCommonSlide'].CPrSection = CPrSection;
