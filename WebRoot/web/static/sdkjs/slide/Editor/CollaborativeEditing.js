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

/**
 *
 * @constructor
 * @extends {AscCommon.CCollaborativeEditingBase}
 */
function CCollaborativeEditing()
{
	AscCommon.CCollaborativeEditingBase.call(this);

    this.m_oLogicDocument     = null;
    this.m_aDocumentPositions = new AscCommon.CDocumentPositionsManager();
    this.m_aForeignCursorsPos = new AscCommon.CDocumentPositionsManager();
    this.m_aForeignCursors    = {};
    this.PosExtChangesX = [];
    this.PosExtChangesY = [];
    this.ScaleX = null;
    this.ScaleY = null;

    this.m_aForeignCursorsXY     = {};
    this.m_aForeignCursorsToShow = {};
}

CCollaborativeEditing.prototype = Object.create(AscCommon.CCollaborativeEditingBase.prototype);
CCollaborativeEditing.prototype.constructor = CCollaborativeEditing;

CCollaborativeEditing.prototype.Send_Changes = function(IsUserSave, AdditionalInfo, IsUpdateInterface, isAfterAskSave)
{
    // Пересчитываем позиции
    this.Refresh_DCChanges();
    this.RefreshPosExtChanges();
    // Генерируем свои изменения
    var StartPoint = ( null === AscCommon.History.SavedIndex ? 0 : AscCommon.History.SavedIndex + 1 );
    var LastPoint  = -1;
    if ( this.m_nUseType <= 0 )
    {
        // (ненужные точки предварительно удаляем)
        AscCommon.History.Clear_Redo();
        LastPoint = AscCommon.History.Points.length - 1;
    }
    else
    {
        LastPoint = AscCommon.History.Index;
    }
    // Просчитаем сколько изменений на сервер пересылать не надо
    var SumIndex = 0;
    var StartPoint2 = Math.min( StartPoint, LastPoint + 1 );
    for ( var PointIndex = 0; PointIndex < StartPoint2; PointIndex++ )
    {
        var Point = AscCommon.History.Points[PointIndex];
        SumIndex += Point.Items.length;
    }
    var deleteIndex = ( null === AscCommon.History.SavedIndex ? null : SumIndex );

    var aChanges = [], aChanges2 = [];
    for ( var PointIndex = StartPoint; PointIndex <= LastPoint; PointIndex++ )
    {
        var Point = AscCommon.History.Points[PointIndex];

        AscCommon.History.Update_PointInfoItem(PointIndex, StartPoint, LastPoint, SumIndex, deleteIndex);
        for ( var Index = 0; Index < Point.Items.length; Index++ )
        {
            var Item = Point.Items[Index];
            var oChanges = new AscCommon.CCollaborativeChanges();
            oChanges.Set_FromUndoRedo( Item.Class, Item.Data, Item.Binary );
            aChanges2.push(Item.Data);
            aChanges.push( oChanges.m_pData );
        }
    }


    // Пока пользователь сидит один, мы не чистим его локи до тех пор пока не зайдет второй
	var bCollaborative = this.getCollaborativeEditing();
		
	var num_arr = [];
    if (bCollaborative)
	{
		var map = this.Release_Locks();

		var UnlockCount2 = this.m_aNeedUnlock2.length;
		for ( var Index = 0; Index < UnlockCount2; Index++ )
		{
			var Class = this.m_aNeedUnlock2[Index];
			Class.Lock.Set_Type( AscCommon.locktype_None, false);
			if(Class.getObjectType && Class.getObjectType() === AscDFH.historyitem_type_Slide)
			{
				editor.WordControl.m_oLogicDocument.DrawingDocument.UnLockSlide(Class.num);
			}
			if(Class instanceof AscCommonSlide.PropLocker)
			{
				var Class2 = AscCommon.g_oTableId.Get_ById(Class.objectId);
				if(Class2 && Class2.getObjectType && Class2.getObjectType() === AscDFH.historyitem_type_Slide && Class2.deleteLock === Class)
				{
					editor.WordControl.m_oLogicDocument.DrawingDocument.UnLockSlide(Class2.num);
				}
			}
            if(Class instanceof AscCommon.CCore)
            {
                editor.sendEvent("asc_onLockCore", false);
            }

			var check_obj = null;
			if(Class.getObjectType)
			{
				if( (Class.getObjectType() === AscDFH.historyitem_type_Shape
					|| Class.getObjectType() === AscDFH.historyitem_type_ImageShape
					|| Class.getObjectType() === AscDFH.historyitem_type_GroupShape
					|| Class.getObjectType() === AscDFH.historyitem_type_GraphicFrame
					|| Class.getObjectType() === AscDFH.historyitem_type_ChartSpace
					|| Class.getObjectType() === AscDFH.historyitem_type_OleObject
					|| Class.getObjectType() === AscDFH.historyitem_type_Cnx) && AscCommon.isRealObject(Class.parent))
				{
					if(Class.parent && AscFormat.isRealNumber(Class.parent.num))
					{
						map[Class.parent.num] = true;
					}

					check_obj =
					{
						"type": c_oAscLockTypeElemPresentation.Object,
						"slideId": Class.parent.Get_Id(),
						"objId": Class.Get_Id(),
						"guid": Class.Get_Id()
					};
				}
				else if(Class.getObjectType() === AscDFH.historyitem_type_Slide)
				{
					check_obj =
					{
						"type": c_oAscLockTypeElemPresentation.Slide,
						"val": Class.Get_Id(),
						"guid": Class.Get_Id()
					};
				}
				else if(Class instanceof AscCommon.CComment){
					if(Class.Parent && Class.Parent.slide){
						if(Class.Parent.slide === editor.WordControl.m_oLogicDocument){
							check_obj =
							{
								"type": c_oAscLockTypeElemPresentation.Slide,
								"val": editor.WordControl.m_oLogicDocument.commentsLock.Get_Id(),
								"guid": editor.WordControl.m_oLogicDocument.commentsLock.Get_Id()
							};
						}
						else {
                            if(Class.Parent.slide.deleteLock){
                                check_obj =
                                {
                                    "type": c_oAscLockTypeElemPresentation.Object,
                                    "slideId": Class.Parent.slide.deleteLock.Get_Id(),
                                    "objId": Class.Get_Id(),
                                    "guid": Class.Get_Id()
                                };
                                map[Class.Parent.slide.num] = true;
                            }
						}
					}
				}
				if(check_obj)
					editor.CoAuthoringApi.releaseLocks( check_obj );
			}
		}


		if(editor.WordControl.m_oDrawingDocument.IsLockObjectsEnable)
		{
			for(var key in map)
			{
				if(map.hasOwnProperty(key))
				{
					num_arr.push(parseInt(key, 10));
				}
			}
			num_arr.sort(AscCommon.fSortAscending);
		}
		this.m_aNeedUnlock.length  = 0;
		this.m_aNeedUnlock2.length = 0;
	}

    if (0 < aChanges.length || null !== deleteIndex) {
        this.private_OnSendOwnChanges(aChanges2, deleteIndex);
        editor.CoAuthoringApi.saveChanges(aChanges, deleteIndex, AdditionalInfo, editor.canUnlockDocument2, bCollaborative);
        AscCommon.History.CanNotAddChanges = true;
    } else
        editor.CoAuthoringApi.unLockDocument(!!isAfterAskSave, editor.canUnlockDocument2, null, bCollaborative);
	editor.canUnlockDocument2 = false;

    if ( -1 === this.m_nUseType )
    {
        // Чистим Undo/Redo только во время совместного редактирования
        AscCommon.History.Clear();
        AscCommon.History.SavedIndex = null;
    }
    else if ( 0 === this.m_nUseType )
    {
        // Чистим Undo/Redo только во время совместного редактирования
        AscCommon.History.Clear();
        AscCommon.History.SavedIndex = null;

        this.m_nUseType = 1;
    }
    else
    {
        // Обновляем точку последнего сохранения в истории
        AscCommon.History.Reset_SavedIndex(IsUserSave);
    }

    for(var i = 0; i < num_arr.length; ++i)
    {
        editor.WordControl.m_oDrawingDocument.OnRecalculatePage(num_arr[i], editor.WordControl.m_oLogicDocument.Slides[num_arr[i]]);
    }
    if(num_arr.length > 0)
    {
        editor.WordControl.m_oDrawingDocument.OnEndRecalculate();
    }
    var oSlide = editor.WordControl.m_oLogicDocument.Slides[editor.WordControl.m_oLogicDocument.CurPage];
    if(oSlide && oSlide.notesShape){
        editor.WordControl.m_oDrawingDocument.Notes_OnRecalculate(editor.WordControl.m_oLogicDocument.CurPage, oSlide.NotesWidth, oSlide.getNotesHeight());
    }
    editor.WordControl.m_oLogicDocument.Document_UpdateInterfaceState();
    editor.WordControl.m_oLogicDocument.Document_UpdateUndoRedoState();

    // editor.WordControl.m_oLogicDocument.DrawingDocument.ClearCachePages();
    //    editor.WordControl.m_oLogicDocument.DrawingDocument.FirePaint();
};

AscCommon.CCollaborativeEditingBase.prototype.Refresh_ForeignCursors = function()
{
    for (var UserId in this.m_aCursorsToUpdate)
    {
        var CursorInfo = this.m_aCursorsToUpdate[UserId];
        editor.WordControl.m_oLogicDocument.Update_ForeignCursor(CursorInfo, UserId, false, this.m_aCursorsToUpdateShortId[UserId]);

        if (this.Add_ForeignCursorToShow)
            this.Add_ForeignCursorToShow(UserId);
    }
    this.m_aCursorsToUpdate = {};
    this.m_aCursorsToUpdateShortId = {};
};

CCollaborativeEditing.prototype.Release_Locks = function()
{
    var map_redraw = {};
    var UnlockCount = this.m_aNeedUnlock.length;
    for ( var Index = 0; Index < UnlockCount; Index++ )
    {
        var CurLockType = this.m_aNeedUnlock[Index].Lock.Get_Type();
        if  ( AscCommon.locktype_Other3 != CurLockType && AscCommon.locktype_Other != CurLockType )
        {
            //if(this.m_aNeedUnlock[Index] instanceof AscCommonSlide.Slide)                                                      //TODO: проверять LockObject
            //    editor.WordControl.m_oLogicDocument.DrawingDocument.UnLockSlide(this.m_aNeedUnlock[Index].num);
            var Class =  this.m_aNeedUnlock[Index];
            this.m_aNeedUnlock[Index].Lock.Set_Type( AscCommon.locktype_None, false);
            if ( Class instanceof AscCommonSlide.PropLocker )
            {
                var object = AscCommon.g_oTableId.Get_ById(Class.objectId);
                if(object instanceof AscCommonSlide.CPresentation)
                {
                    if(Class === editor.WordControl.m_oLogicDocument.themeLock)
                    {
                        editor.sendEvent("asc_onUnLockDocumentTheme");
                    }
                    else if(Class === editor.WordControl.m_oLogicDocument.schemeLock)
                    {
                        editor.sendEvent("asc_onUnLockDocumentSchema");
                    }
                    else if(Class === editor.WordControl.m_oLogicDocument.slideSizeLock)
                    {
                        editor.sendEvent("asc_onUnLockDocumentProps");
                    }
                }
                if(object.getObjectType && object.getObjectType() === AscDFH.historyitem_type_Slide && object.deleteLock === Class)
                {
                    editor.WordControl.m_oLogicDocument.DrawingDocument.UnLockSlide(object.num);
                }
            }
            if(Class instanceof AscCommon.CComment)
            {
                editor.sync_UnLockComment(Class.Get_Id());
                if(Class.Parent && Class.Parent.slide && editor.WordControl.m_oLogicDocument !== Class.Parent.slide)
                {
                    map_redraw[Class.Parent.slide.num] = true;
                }
            }
            if(Class instanceof AscCommon.CCore)
            {
                editor.sendEvent("asc_onLockCore", false);
            }
        }
        else if ( AscCommon.locktype_Other3 === CurLockType )
        {
            this.m_aNeedUnlock[Index].Lock.Set_Type( AscCommon.locktype_Other, false);
            if(this.m_aNeedUnlock[Index] instanceof AscCommonSlide.Slide)
                editor.WordControl.m_oLogicDocument.DrawingDocument.LockSlide(this.m_aNeedUnlock[Index].num);
        }
        if(this.m_aNeedUnlock[Index].parent && AscFormat.isRealNumber(this.m_aNeedUnlock[Index].parent.num))
        {
            map_redraw[this.m_aNeedUnlock[Index].parent.num] = true;
        }
    }
    return map_redraw;
};

CCollaborativeEditing.prototype.OnEnd_Load_Objects = function()
{
    // Данная функция вызывается, когда загрузились внешние объекты (картинки и шрифты)

    // Снимаем лок
    AscCommon.CollaborativeEditing.Set_GlobalLock(false);
    AscCommon.CollaborativeEditing.Set_GlobalLockSelection(false);

    // Запускаем полный пересчет документа
    var LogicDocument = editor.WordControl.m_oLogicDocument;

    var RecalculateData =
    {
        Drawings: {
            All: true
        },
        Map: {

        }
    };

    LogicDocument.Recalculate(RecalculateData);
    LogicDocument.Document_UpdateSelectionState();
    LogicDocument.Document_UpdateInterfaceState();

    editor.sync_EndAction(Asc.c_oAscAsyncActionType.BlockInteraction, Asc.c_oAscAsyncAction.ApplyChanges);
};

CCollaborativeEditing.prototype.OnEnd_CheckLock = function()
{
    var aIds = [];

    var Count = this.m_aCheckLocks.length;
    for ( var Index = 0; Index < Count; Index++ )
    {
        var oItem = this.m_aCheckLocks[Index];

        if ( true === oItem ) // сравниваем по значению и типу обязательно
            return true;
        else if ( false !== oItem )
            aIds.push( oItem );
    }

    if ( aIds.length > 0 )
    {
        // Отправляем запрос на сервер со списком Id
        editor.CoAuthoringApi.askLock( aIds, this.OnCallback_AskLock );

        // Ставим глобальный лок, только во время совместного редактирования
        if ( -1 === this.m_nUseType )
		{
			this.Set_GlobalLock(true);
		}
        else
        {
            // Пробегаемся по массиву и проставляем, что залочено нами
            var Count = this.m_aCheckLocks.length;
            for ( var Index = 0; Index < Count; Index++ )
            {
                var oItem = this.m_aCheckLocks[Index];
                var items = [];
                switch(oItem["type"])
                {
                    case c_oAscLockTypeElemPresentation.Object:
                    {
                        items.push(oItem["objId"]);
                        items.push(oItem["slideId"]);
                        break;
                    }
                    case c_oAscLockTypeElemPresentation.Slide:
                    {
                        items.push(oItem["val"]);
                        break;
                    }
                    case c_oAscLockTypeElemPresentation.Presentation:
                    {
                        break;
                    }
                }

                for(var i = 0; i < items.length; ++i)
                {
                    var item = items[i];
                    if ( true !== item && false !== item ) // сравниваем по значению и типу обязательно
                    {
                        var Class = AscCommon.g_oTableId.Get_ById( item );
                        if ( null != Class )
                        {
                            Class.Lock.Set_Type( AscCommon.locktype_Mine, false );
                            if(Class instanceof AscCommonSlide.Slide)
                                editor.WordControl.m_oLogicDocument.DrawingDocument.UnLockSlide(Class.num);
                            this.Add_Unlock2( Class );
                        }
                    }
                }
            }

            this.m_aCheckLocks.length = 0;
        }
    }

    return false;
};

CCollaborativeEditing.prototype.OnCallback_AskLock = function(result)
{
    if (true === AscCommon.CollaborativeEditing.Get_GlobalLock())
    {
        if (false == editor.checkLongActionCallback(AscCommon.CollaborativeEditing.OnCallback_AskLock, result))
            return;

        // Снимаем глобальный лок
        AscCommon.CollaborativeEditing.Set_GlobalLock(false);

        if (result["lock"])
        {
            // Пробегаемся по массиву и проставляем, что залочено нами

            var Count = AscCommon.CollaborativeEditing.m_aCheckLocks.length;
            for ( var Index = 0; Index < Count; Index++ )
            {
                var oItem = AscCommon.CollaborativeEditing.m_aCheckLocks[Index];
                var item;
                switch(oItem["type"])
                {
                    case c_oAscLockTypeElemPresentation.Object:
                    {
                        item = oItem["objId"];
                        break;
                    }
                    case c_oAscLockTypeElemPresentation.Slide:
                    {
                        item = oItem["val"];
                        break;
                    }
                    case c_oAscLockTypeElemPresentation.Presentation:
                    {
                        break;
                    }
                }
                if ( true !== oItem && false !== oItem ) // сравниваем по значению и типу обязательно
                {
                    var Class = AscCommon.g_oTableId.Get_ById( item );
                    if ( null != Class )
                    {
                        Class.Lock.Set_Type( AscCommon.locktype_Mine );
                        if(Class instanceof AscCommonSlide.Slide)
                            editor.WordControl.m_oLogicDocument.DrawingDocument.UnLockSlide(Class.num);
                        AscCommon.CollaborativeEditing.Add_Unlock2( Class );
                    }
                }
            }
        }
        else if (result["error"])
        {
            // Если у нас началось редактирование диаграммы, а вернулось, что ее редактировать нельзя,
            // посылаем сообщение о закрытии редактора диаграмм.
            if ( true === editor.isChartEditor )
                editor.sync_closeChartEditor();

            // Делаем откат на 1 шаг назад и удаляем из Undo/Redo эту последнюю точку
            editor.WordControl.m_oLogicDocument.Document_Undo();
            AscCommon.History.Clear_Redo();
        }

    }
    editor.isChartEditor = false;
};

CCollaborativeEditing.prototype.AddPosExtChanges = function(Item, ChangeObject)
{
    if(ChangeObject.IsHorizontal())
    {
        this.PosExtChangesX.push(Item);
    }
    else
    {
        this.PosExtChangesY.push(Item);
    }
};


CCollaborativeEditing.prototype.RewritePosExtChanges = function(changesArr, scale)
{
    for(var i = 0; i < changesArr.length; ++i)
    {
        var changes = changesArr[i];
        var data = changes.Data;
        data.New *= scale;
        data.Old *= scale;
        var Binary_Writer = AscCommon.History.BinaryWriter;
        var Binary_Pos    = Binary_Writer.GetCurPosition();
        Binary_Writer.WriteString2(changes.Class.Get_Id());
        Binary_Writer.WriteLong(changes.Data.Type);
        changes.Data.WriteToBinary(Binary_Writer);

        var Binary_Len = Binary_Writer.GetCurPosition() - Binary_Pos;

        changes.Binary.Pos = Binary_Pos;
        changes.Binary.Len = Binary_Len;
    }
};

CCollaborativeEditing.prototype.RefreshPosExtChanges = function()
{
    if(this.ScaleX != null && this.ScaleY != null)
    {
        this.RewritePosExtChanges(this.PosExtChangesX, this.ScaleX);
        this.RewritePosExtChanges(this.PosExtChangesY, this.ScaleY);
    }
    this.PosExtChangesX.length = 0;
    this.PosExtChangesY.length = 0;
    this.ScaleX = null;
    this.ScaleY = null;
};

CCollaborativeEditing.prototype.Update_ForeignCursorsPositions = function()
{
    var DrawingDocument = editor.WordControl.m_oDrawingDocument;
    var oPresentation = editor.WordControl.m_oLogicDocument;
    var oTargetDocContentOrTable;
    var oCurController = oPresentation.GetCurrentController();
    if(oCurController){
        oTargetDocContentOrTable = oCurController.getTargetDocContent(undefined, true);
    }
    if(!oTargetDocContentOrTable){
        for (var UserId in this.m_aForeignCursors){
            DrawingDocument.Collaborative_RemoveTarget(UserId);
        }
        return;
    }
    var bTable = (oTargetDocContentOrTable instanceof AscCommonWord.CTable);
    for (var UserId in this.m_aForeignCursors){
        var DocPos = this.m_aForeignCursors[UserId];
        if (!DocPos || DocPos.length <= 0)
            continue;

        this.m_aForeignCursorsPos.Update_DocumentPosition(DocPos);

        var Run      = DocPos[DocPos.length - 1].Class;
        var InRunPos = DocPos[DocPos.length - 1].Position;
        this.Update_ForeignCursorPosition(UserId, Run, InRunPos, false, oTargetDocContentOrTable, bTable);
    }
};

CCollaborativeEditing.prototype.Update_ForeignCursorPosition = function(UserId, Run, InRunPos, isRemoveLabel, oTargetDocContentOrTable, bTable){
    if (!(Run instanceof AscCommonWord.ParaRun))
        return;

    var DrawingDocument = editor.WordControl.m_oDrawingDocument;
    var oPresentation = editor.WordControl.m_oLogicDocument;
    var Paragraph = Run.GetParagraph();
    if (!Paragraph || !Paragraph.Parent){
        DrawingDocument.Collaborative_RemoveTarget(UserId);
        return;
    }

    if(!bTable){
        if(oTargetDocContentOrTable !== Paragraph.Parent){
            DrawingDocument.Collaborative_RemoveTarget(UserId);
            return;
        }
    }
    else{
        if(!Paragraph.Parent.Parent || !Paragraph.Parent.Parent.Row ||
            !Paragraph.Parent.Parent.Row.Table || Paragraph.Parent.Parent.Row.Table !== oTargetDocContentOrTable){
            DrawingDocument.Collaborative_RemoveTarget(UserId);
            return;
        }
    }

    var ParaContentPos = Paragraph.Get_PosByElement(Run);
    if (!ParaContentPos){
        DrawingDocument.Collaborative_RemoveTarget(UserId);
        return;
    }
    ParaContentPos.Update(InRunPos, ParaContentPos.Get_Depth() + 1);
    var XY = Paragraph.Get_XYByContentPos(ParaContentPos);
    if (XY && XY.Height > 0.001){
        var ShortId = this.m_aForeignCursorsId[UserId] ? this.m_aForeignCursorsId[UserId] : UserId;
        DrawingDocument.Collaborative_UpdateTarget(UserId, ShortId, XY.X, XY.Y, XY.Height, oPresentation.CurPage, Paragraph.Get_ParentTextTransform());
        this.Add_ForeignCursorXY(UserId, XY.X, XY.Y, XY.PageNum, XY.Height, Paragraph, isRemoveLabel);
        if (true === this.m_aForeignCursorsToShow[UserId]){
            this.Show_ForeignCursorLabel(UserId);
            this.Remove_ForeignCursorToShow(UserId);
        }
    }
    else{
        DrawingDocument.Collaborative_RemoveTarget(UserId);
        this.Remove_ForeignCursorXY(UserId);
        this.Remove_ForeignCursorToShow(UserId);
    }
};

CCollaborativeEditing.prototype.Check_ForeignCursorsLabels = function(X, Y, PageIndex){

    var DrawingDocument = editor.WordControl.m_oDrawingDocument;
    var Px7 = DrawingDocument.GetMMPerDot(7);
    var Px3 = DrawingDocument.GetMMPerDot(3);

    for (var UserId in this.m_aForeignCursorsXY){
        var Cursor = this.m_aForeignCursorsXY[UserId];
        if (true === Cursor.Transform && Cursor.PageIndex === PageIndex && Cursor.X0 - Px3 < X && X < Cursor.X1 + Px3 && Cursor.Y0 - Px3 < Y && Y < Cursor.Y1 + Px3){
            this.Show_ForeignCursorLabel(UserId);
        }
    }
};
CCollaborativeEditing.prototype.Show_ForeignCursorLabel = function(UserId)
{

    var Api = editor;
    var DrawingDocument = editor.WordControl.m_oDrawingDocument;

    if (!this.m_aForeignCursorsXY[UserId])
        return;

    var Cursor = this.m_aForeignCursorsXY[UserId];
    if (Cursor.ShowId)
        clearTimeout(Cursor.ShowId);

    Cursor.ShowId = setTimeout(function()
    {
        Cursor.ShowId = null;
        Api.sync_HideForeignCursorLabel(UserId);
    }, AscCommon.FOREIGN_CURSOR_LABEL_HIDETIME);

    var UserShortId = this.m_aForeignCursorsId[UserId] ? this.m_aForeignCursorsId[UserId] : UserId;
    var Color  = AscCommon.getUserColorById(UserShortId, null, true);
    var Coords = DrawingDocument.Collaborative_GetTargetPosition(UserId);
    if (!Color || !Coords)
        return;

    this.Update_ForeignCursorLabelPosition(UserId, Coords.X, Coords.Y, Color);
};
CCollaborativeEditing.prototype.Add_ForeignCursorToShow = function(UserId)
{
    this.m_aForeignCursorsToShow[UserId] = true;
};
CCollaborativeEditing.prototype.Remove_ForeignCursorToShow = function(UserId)
{
    delete this.m_aForeignCursorsToShow[UserId];
};
CCollaborativeEditing.prototype.Add_ForeignCursorXY = function(UserId, X, Y, PageIndex, H, Paragraph, isRemoveLabel)
{
    var Cursor;
    if (!this.m_aForeignCursorsXY[UserId])
    {
        Cursor = {X: X, Y: Y, H: H, PageIndex: PageIndex, Transform: false, ShowId: null};
        this.m_aForeignCursorsXY[UserId] = Cursor;
    }
    else
    {
        Cursor = this.m_aForeignCursorsXY[UserId];
        if (Cursor.ShowId)
        {
            if (true === isRemoveLabel)
            {
                clearTimeout(Cursor.ShowId);
                Cursor.ShowId = null;
                editor.sync_HideForeignCursorLabel(UserId);
            }
        }
        else
        {
            Cursor.ShowId = null;
        }

        Cursor.X         = X;
        Cursor.Y         = Y;
        Cursor.PageIndex = PageIndex;
        Cursor.H         = H;
    }

    var Transform = Paragraph.Get_ParentTextTransform();
    if (Transform)
    {
        Cursor.Transform = true;
        var X0 = Transform.TransformPointX(Cursor.X, Cursor.Y);
        var Y0 = Transform.TransformPointY(Cursor.X, Cursor.Y);
        var X1 = Transform.TransformPointX(Cursor.X, Cursor.Y + Cursor.H);
        var Y1 = Transform.TransformPointY(Cursor.X, Cursor.Y + Cursor.H);

        Cursor.X0 = Math.min(X0, X1);
        Cursor.Y0 = Math.min(Y0, Y1);
        Cursor.X1 = Math.max(X0, X1);
        Cursor.Y1 = Math.max(Y0, Y1);
    }
    else
    {
        Cursor.Transform = false;
    }

};
CCollaborativeEditing.prototype.Remove_ForeignCursorXY = function(UserId)
{
    if (this.m_aForeignCursorsXY[UserId])
    {
        if (this.m_aForeignCursorsXY[UserId].ShowId)
        {
            editor.sync_HideForeignCursorLabel(UserId);
            clearTimeout(this.m_aForeignCursorsXY[UserId].ShowId);
        }

        delete this.m_aForeignCursorsXY[UserId];
    }
};
CCollaborativeEditing.prototype.Update_ForeignCursorLabelPosition = function(UserId, X, Y, Color)
{

    var Cursor = this.m_aForeignCursorsXY[UserId];
    if (!Cursor || !Cursor.ShowId)
        return;

    editor.sync_ShowForeignCursorLabel(UserId, X, Y, Color);
};


CCollaborativeEditing.prototype.private_RecalculateDocument = function(oRecalcData){
    this.m_oLogicDocument.Recalculate(oRecalcData);
};


//--------------------------------------------------------export----------------------------------------------------
window['AscCommon'] = window['AscCommon'] || {};
window['AscCommon'].CollaborativeEditing = new CCollaborativeEditing();
