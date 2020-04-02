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

(function(window, undefined){

var global_hatch_data = [
    /* cross */
    0,0,0,0,0,0,0,0,
    0,1,1,1,0,1,1,1,
    0,1,1,1,0,1,1,1,
    0,1,1,1,0,1,1,1,
    0,0,0,0,0,0,0,0,
    0,1,1,1,0,1,1,1,
    0,1,1,1,0,1,1,1,
    0,1,1,1,0,1,1,1,

    /* dashDnDiag */
    1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,
    0,1,1,1,0,1,1,1,
    1,0,1,1,1,0,1,1,
    1,1,0,1,1,1,0,1,
    1,1,1,0,1,1,1,0,
    1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,

    /* dashHorz */
    0,0,0,0,1,1,1,1,
    1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,
    1,1,1,1,0,0,0,0,
    1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,

    /* dashUpDiag */
    1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,
    1,1,1,0,1,1,1,0,
    1,1,0,1,1,1,0,1,
    1,0,1,1,1,0,1,1,
    0,1,1,1,0,1,1,1,
    1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,

    /* dashVert */
    0,1,1,1,1,1,1,1,
    0,1,1,1,1,1,1,1,
    0,1,1,1,1,1,1,1,
    0,1,1,1,1,1,1,1,
    1,1,1,1,0,1,1,1,
    1,1,1,1,0,1,1,1,
    1,1,1,1,0,1,1,1,
    1,1,1,1,0,1,1,1,

    /* diagBrick */
    1,1,1,1,1,1,1,0,
    1,1,1,1,1,1,0,1,
    1,1,1,1,1,0,1,1,
    1,1,1,1,0,1,1,1,
    1,1,1,0,0,1,1,1,
    1,1,0,1,1,0,1,1,
    1,0,1,1,1,1,0,1,
    0,1,1,1,1,1,1,0,

    /* diagCross */
    0,1,1,1,1,1,0,1,
    1,0,1,1,1,0,1,1,
    1,1,0,1,0,1,1,1,
    1,1,1,0,1,1,1,1,
    1,1,0,1,0,1,1,1,
    1,0,1,1,1,0,1,1,
    0,1,1,1,1,1,0,1,
    1,1,1,1,1,1,1,0,

    /* divot */
    1,1,1,1,1,1,1,1,
    1,1,1,0,1,1,1,1,
    1,1,1,1,0,1,1,1,
    1,1,1,0,1,1,1,1,
    1,1,1,1,1,1,1,1,
    0,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,0,
    0,1,1,1,1,1,1,1,

    /* dkDnDiag */
    0,0,1,1,0,0,1,1,
    1,0,0,1,1,0,0,1,
    1,1,0,0,1,1,0,0,
    0,1,1,0,0,1,1,0,
    0,0,1,1,0,0,1,1,
    1,0,0,1,1,0,0,1,
    1,1,0,0,1,1,0,0,
    0,1,1,0,0,1,1,0,

    /* dkHorz */
    0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,
    1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,
    0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,
    1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,

    /* dkUpDiag */
    1,1,0,0,1,1,0,0,
    1,0,0,1,1,0,0,1,
    0,0,1,1,0,0,1,1,
    0,1,1,0,0,1,1,0,
    1,1,0,0,1,1,0,0,
    1,0,0,1,1,0,0,1,
    0,0,1,1,0,0,1,1,
    0,1,1,0,0,1,1,0,

    /* dkVert */
    0,0,1,1,0,0,1,1,
    0,0,1,1,0,0,1,1,
    0,0,1,1,0,0,1,1,
    0,0,1,1,0,0,1,1,
    0,0,1,1,0,0,1,1,
    0,0,1,1,0,0,1,1,
    0,0,1,1,0,0,1,1,
    0,0,1,1,0,0,1,1,

    /* dnDiag */
    0,1,1,1,0,1,1,1,
    1,0,1,1,1,0,1,1,
    1,1,0,1,1,1,0,1,
    1,1,1,0,1,1,1,0,
    0,1,1,1,0,1,1,1,
    1,0,1,1,1,0,1,1,
    1,1,0,1,1,1,0,1,
    1,1,1,0,1,1,1,0,

    /* dotDmnd */
    0,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,
    1,1,0,1,1,1,0,1,
    1,1,1,1,1,1,1,1,
    1,1,1,1,0,1,1,1,
    1,1,1,1,1,1,1,1,
    1,1,0,1,1,1,0,1,
    1,1,1,1,1,1,1,1,

    /* dotGrid */
    0,1,0,1,0,1,0,1,
    1,1,1,1,1,1,1,1,
    0,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,
    0,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,
    0,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,

    /* horz */
    0,0,0,0,0,0,0,0,
    1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,
    0,0,0,0,0,0,0,0,
    1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,

    /* horzBrick */
    0,0,0,0,0,0,0,0,
    0,1,1,1,1,1,1,1,
    0,1,1,1,1,1,1,1,
    0,1,1,1,1,1,1,1,
    0,0,0,0,0,0,0,0,
    1,1,1,1,0,1,1,1,
    1,1,1,1,0,1,1,1,
    1,1,1,1,0,1,1,1,

    /* lgCheck */
    0,0,0,0,1,1,1,1,
    0,0,0,0,1,1,1,1,
    0,0,0,0,1,1,1,1,
    0,0,0,0,1,1,1,1,
    1,1,1,1,0,0,0,0,
    1,1,1,1,0,0,0,0,
    1,1,1,1,0,0,0,0,
    1,1,1,1,0,0,0,0,

    /* lgConfetti */
    0,1,0,0,1,1,1,0,
    1,1,0,0,1,1,1,1,
    1,1,1,1,1,1,0,0,
    1,1,1,0,0,1,0,0,
    0,0,1,0,0,1,1,1,
    0,0,1,1,1,1,1,1,
    1,1,1,1,0,0,1,1,
    0,1,1,1,0,0,1,0,

    /* lgGrid */
    0,0,0,0,0,0,0,0,
    0,1,1,1,1,1,1,1,
    0,1,1,1,1,1,1,1,
    0,1,1,1,1,1,1,1,
    0,1,1,1,1,1,1,1,
    0,1,1,1,1,1,1,1,
    0,1,1,1,1,1,1,1,
    0,1,1,1,1,1,1,1,

    /* ltDnDiag */
    0,1,1,1,0,1,1,1,
    1,0,1,1,1,0,1,1,
    1,1,0,1,1,1,0,1,
    1,1,1,0,1,1,1,0,
    0,1,1,1,0,1,1,1,
    1,0,1,1,1,0,1,1,
    1,1,0,1,1,1,0,1,
    1,1,1,0,1,1,1,0,

    /* ltHorz */
    0,0,0,0,0,0,0,0,
    1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,
    0,0,0,0,0,0,0,0,
    1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,

    /* ltUpDiag */
    1,1,1,0,1,1,1,0,
    1,1,0,1,1,1,0,1,
    1,0,1,1,1,0,1,1,
    0,1,1,1,0,1,1,1,
    1,1,1,0,1,1,1,0,
    1,1,0,1,1,1,0,1,
    1,0,1,1,1,0,1,1,
    0,1,1,1,0,1,1,1,

    /* ltVert */
    0,1,1,1,0,1,1,1,
    0,1,1,1,0,1,1,1,
    0,1,1,1,0,1,1,1,
    0,1,1,1,0,1,1,1,
    0,1,1,1,0,1,1,1,
    0,1,1,1,0,1,1,1,
    0,1,1,1,0,1,1,1,
    0,1,1,1,0,1,1,1,

    /* narHorz */
    0,0,0,0,0,0,0,0,
    1,1,1,1,1,1,1,1,
    0,0,0,0,0,0,0,0,
    1,1,1,1,1,1,1,1,
    0,0,0,0,0,0,0,0,
    1,1,1,1,1,1,1,1,
    0,0,0,0,0,0,0,0,
    1,1,1,1,1,1,1,1,

    /* narVert */
    1,0,1,0,1,0,1,0,
    1,0,1,0,1,0,1,0,
    1,0,1,0,1,0,1,0,
    1,0,1,0,1,0,1,0,
    1,0,1,0,1,0,1,0,
    1,0,1,0,1,0,1,0,
    1,0,1,0,1,0,1,0,
    1,0,1,0,1,0,1,0,

    /* openDmnd */
    0,1,1,1,1,1,0,1,
    1,0,1,1,1,0,1,1,
    1,1,0,1,0,1,1,1,
    1,1,1,0,1,1,1,1,
    1,1,0,1,0,1,1,1,
    1,0,1,1,1,0,1,1,
    0,1,1,1,1,1,0,1,
    1,1,1,1,1,1,1,0,

    /* pct10 */
    0,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,
    1,1,1,1,0,1,1,1,
    1,1,1,1,1,1,1,1,
    0,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,
    1,1,1,1,0,1,1,1,
    1,1,1,1,1,1,1,1,

    /* pct20 */
    0,1,1,1,0,1,1,1,
    1,1,1,1,1,1,1,1,
    1,1,0,1,1,1,0,1,
    1,1,1,1,1,1,1,1,
    0,1,1,1,0,1,1,1,
    1,1,1,1,1,1,1,1,
    1,1,0,1,1,1,0,1,
    1,1,1,1,1,1,1,1,

    /* pct25 */
    0,1,1,1,0,1,1,1,
    1,1,0,1,1,1,0,1,
    0,1,1,1,0,1,1,1,
    1,1,0,1,1,1,0,1,
    0,1,1,1,0,1,1,1,
    1,1,0,1,1,1,0,1,
    0,1,1,1,0,1,1,1,
    1,1,0,1,1,1,0,1,

    /* pct30 */
    0,1,0,1,0,1,0,1,
    1,0,1,1,1,0,1,1,
    0,1,0,1,0,1,0,1,
    1,1,1,0,1,1,1,0,
    0,1,0,1,0,1,0,1,
    1,0,1,1,1,0,1,1,
    0,1,0,1,0,1,0,1,
    1,1,1,0,1,1,1,0,

    /* pct40 */
    0,1,0,1,0,1,0,1,
    1,0,1,0,1,0,1,0,
    0,1,0,1,0,1,0,1,
    1,0,1,0,1,1,1,0,
    0,1,0,1,0,1,0,1,
    1,0,1,0,1,0,1,0,
    0,1,0,1,0,1,0,1,
    1,1,1,0,1,0,1,0,

    /* pct5 */
    0,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,
    1,1,1,1,0,1,1,1,
    1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,

    /* pct50 */
    0,1,0,1,0,1,0,1,
    1,0,1,0,1,0,1,0,
    0,1,0,1,0,1,0,1,
    1,0,1,0,1,0,1,0,
    0,1,0,1,0,1,0,1,
    1,0,1,0,1,0,1,0,
    0,1,0,1,0,1,0,1,
    1,0,1,0,1,0,1,0,

    /* pct60 */
    0,0,0,1,0,0,0,1,
    1,0,1,0,1,0,1,0,
    0,1,0,0,0,1,0,0,
    1,0,1,0,1,0,1,0,
    0,0,0,1,0,0,0,1,
    1,0,1,0,1,0,1,0,
    0,1,0,0,0,1,0,0,
    1,0,1,0,1,0,1,0,

    /* pct70 */
    1,0,0,0,1,0,0,0,
    0,0,1,0,0,0,1,0,
    1,0,0,0,1,0,0,0,
    0,0,1,0,0,0,1,0,
    1,0,0,0,1,0,0,0,
    0,0,1,0,0,0,1,0,
    1,0,0,0,1,0,0,0,
    0,0,1,0,0,0,1,0,

    /* pct75 */
    1,0,0,0,1,0,0,0,
    0,0,0,0,0,0,0,0,
    0,0,1,0,0,0,1,0,
    0,0,0,0,0,0,0,0,
    1,0,0,0,1,0,0,0,
    0,0,0,0,0,0,0,0,
    0,0,1,0,0,0,1,0,
    0,0,0,0,0,0,0,0,

    /* pct80 */
    0,0,0,1,0,0,0,0,
    0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,1,
    0,0,0,0,0,0,0,0,
    0,0,0,1,0,0,0,0,
    0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,1,
    0,0,0,0,0,0,0,0,

    /* pct90 */
    0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,
    0,0,0,0,1,0,0,0,
    0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,
    1,0,0,0,0,0,0,0,

    /* plaid */
    0,1,0,1,0,1,0,1,
    1,0,1,0,1,0,1,0,
    0,1,0,1,0,1,0,1,
    1,0,1,0,1,0,1,0,
    0,0,0,0,1,1,1,1,
    0,0,0,0,1,1,1,1,
    0,0,0,0,1,1,1,1,
    0,0,0,0,1,1,1,1,

    /* shingle */
    1,1,1,1,1,1,0,0,
    0,1,1,1,1,0,1,1,
    1,0,1,1,0,1,1,1,
    1,1,0,0,1,1,1,1,
    1,1,1,1,0,0,1,1,
    1,1,1,1,1,1,0,1,
    1,1,1,1,1,1,1,0,
    1,1,1,1,1,1,1,0,

    /* smCheck */
    0,1,1,0,0,1,1,0,
    1,0,0,1,1,0,0,1,
    1,0,0,1,1,0,0,1,
    0,1,1,0,0,1,1,0,
    0,1,1,0,0,1,1,0,
    1,0,0,1,1,0,0,1,
    1,0,0,1,1,0,0,1,
    0,1,1,0,0,1,1,0,

    /* smConfetti */
    0,1,1,1,1,1,1,1,
    1,1,1,1,0,1,1,1,
    1,0,1,1,1,1,1,1,
    1,1,1,1,1,1,0,1,
    1,1,1,0,1,1,1,1,
    1,1,1,1,1,1,1,0,
    1,1,0,1,1,1,1,1,
    1,1,1,1,1,0,1,1,

    /* smGrid */
    0,0,0,0,0,0,0,0,
    0,1,1,1,0,1,1,1,
    0,1,1,1,0,1,1,1,
    0,1,1,1,0,1,1,1,
    0,0,0,0,0,0,0,0,
    0,1,1,1,0,1,1,1,
    0,1,1,1,0,1,1,1,
    0,1,1,1,0,1,1,1,

    /* solidDmnd */
    1,1,1,0,1,1,1,1,
    1,1,0,0,0,1,1,1,
    1,0,0,0,0,0,1,1,
    0,0,0,0,0,0,0,1,
    1,0,0,0,0,0,1,1,
    1,1,0,0,0,1,1,1,
    1,1,1,0,1,1,1,1,
    1,1,1,1,1,1,1,1,

    /* sphere */
    1,0,0,0,1,0,0,0,
    0,1,1,1,0,1,1,0,
    0,1,1,1,0,0,0,0,
    0,1,1,1,0,0,0,0,
    1,0,0,0,1,0,0,0,
    0,1,1,0,0,1,1,1,
    0,0,0,0,0,1,1,1,
    0,0,0,0,0,1,1,1,

    /* trellis */
    0,0,0,0,0,0,0,0,
    1,0,0,1,1,0,0,1,
    0,0,0,0,0,0,0,0,
    0,1,1,0,0,1,1,0,
    0,0,0,0,0,0,0,0,
    1,0,0,1,1,0,0,1,
    0,0,0,0,0,0,0,0,
    0,1,1,0,0,1,1,0,

    /* upDiag */
    1,1,0,0,1,1,0,0,
    1,0,0,1,1,0,0,1,
    0,0,1,1,0,0,1,1,
    0,1,1,0,0,1,1,0,
    1,1,0,0,1,1,0,0,
    1,0,0,1,1,0,0,1,
    0,0,1,1,0,0,1,1,
    0,1,1,0,0,1,1,0,

    /* vert */
    0,1,1,1,0,1,1,1,
    0,1,1,1,0,1,1,1,
    0,1,1,1,0,1,1,1,
    0,1,1,1,0,1,1,1,
    0,1,1,1,0,1,1,1,
    0,1,1,1,0,1,1,1,
    0,1,1,1,0,1,1,1,
    0,1,1,1,0,1,1,1,

    /* wave */
    1,1,1,1,1,1,1,1,
    1,1,1,0,0,1,1,1,
    1,1,0,1,1,0,1,0,
    0,0,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,
    1,1,1,0,0,1,1,1,
    1,1,0,1,1,0,1,0,
    0,0,1,1,1,1,1,1,

    /* wdDnDiag */
    0,0,1,1,1,1,1,0,
    0,0,0,1,1,1,1,1,
    1,0,0,0,1,1,1,1,
    1,1,0,0,0,1,1,1,
    1,1,1,0,0,0,1,1,
    1,1,1,1,0,0,0,1,
    1,1,1,1,1,0,0,0,
    0,1,1,1,1,1,0,0,

    /* wdUpDiag */
    0,1,1,1,1,1,0,0,
    1,1,1,1,1,0,0,0,
    1,1,1,1,0,0,0,1,
    1,1,1,0,0,0,1,1,
    1,1,0,0,0,1,1,1,
    1,0,0,0,1,1,1,1,
    0,0,0,1,1,1,1,1,
    0,0,1,1,1,1,1,0,

    /* weave */
    0,1,1,1,0,1,1,1,
    1,0,1,0,1,0,1,1,
    1,1,0,1,1,1,0,1,
    1,0,1,1,1,0,1,1,
    0,1,1,1,0,1,1,1,
    1,1,1,0,1,0,1,1,
    1,1,0,1,1,1,0,1,
    1,0,1,0,1,1,1,0,

    /* zigZag */
    0,1,1,1,1,1,1,0,
    1,0,1,1,1,1,0,1,
    1,1,0,1,1,0,1,1,
    1,1,1,0,0,1,1,1,
    0,1,1,1,1,1,1,0,
    1,0,1,1,1,1,0,1,
    1,1,0,1,1,0,1,1,
    1,1,1,0,0,1,1,1
];

var HATCH_TX_SIZE = 8;

var global_hatch_offsets = {};
global_hatch_offsets["cross"]       = 0;
global_hatch_offsets["dashDnDiag"]  = 1;
global_hatch_offsets["dashHorz"]    = 2;
global_hatch_offsets["dashUpDiag"]  = 3;
global_hatch_offsets["dashVert"]    = 4;
global_hatch_offsets["diagBrick"]   = 5;
global_hatch_offsets["diagCross"]   = 6;
global_hatch_offsets["divot"]       = 7;
global_hatch_offsets["dkDnDiag"]    = 8;
global_hatch_offsets["dkHorz"]      = 9;
global_hatch_offsets["dkUpDiag"]    = 10;
global_hatch_offsets["dkVert"]      = 11;
global_hatch_offsets["dnDiag"]      = 12;
global_hatch_offsets["dotDmnd"]     = 13;
global_hatch_offsets["dotGrid"]     = 14;
global_hatch_offsets["horz"]        = 15;
global_hatch_offsets["horzBrick"]   = 16;
global_hatch_offsets["lgCheck"]     = 17;
global_hatch_offsets["lgConfetti"]  = 18;
global_hatch_offsets["lgGrid"]      = 19;
global_hatch_offsets["ltDnDiag"]    = 20;
global_hatch_offsets["ltHorz"]      = 21;
global_hatch_offsets["ltUpDiag"]    = 22;
global_hatch_offsets["ltVert"]      = 23;
global_hatch_offsets["narHorz"]     = 24;
global_hatch_offsets["narVert"]     = 25;
global_hatch_offsets["openDmnd"]    = 26;
global_hatch_offsets["pct10"]       = 27;
global_hatch_offsets["pct20"]       = 28;
global_hatch_offsets["pct25"]       = 29;
global_hatch_offsets["pct30"]       = 30;
global_hatch_offsets["pct40"]       = 31;
global_hatch_offsets["pct5"]        = 32;
global_hatch_offsets["pct50"]       = 33;
global_hatch_offsets["pct60"]       = 34;
global_hatch_offsets["pct70"]       = 35;
global_hatch_offsets["pct75"]       = 36;
global_hatch_offsets["pct80"]       = 37;
global_hatch_offsets["pct90"]       = 38;
global_hatch_offsets["plaid"]       = 39;
global_hatch_offsets["shingle"]     = 40;
global_hatch_offsets["smCheck"]     = 41;
global_hatch_offsets["smConfetti"]  = 42;
global_hatch_offsets["smGrid"]      = 43;
global_hatch_offsets["solidDmnd"]   = 44;
global_hatch_offsets["sphere"]      = 45;
global_hatch_offsets["trellis"]     = 46;
global_hatch_offsets["upDiag"]      = 47;
global_hatch_offsets["vert"]        = 48;
global_hatch_offsets["wave"]        = 49;
global_hatch_offsets["wdDnDiag"]    = 50;
global_hatch_offsets["wdUpDiag"]    = 51;
global_hatch_offsets["weave"]       = 52;
global_hatch_offsets["zigZag"]      = 53;

var global_hatch_names = [
"cross",
"dashDnDiag",
"dashHorz",
"dashUpDiag",
"dashVert",
"diagBrick",
"diagCross",
"divot",
"dkDnDiag",
"dkHorz",
"dkUpDiag",
"dkVert",
"dnDiag",
"dotDmnd",
"dotGrid",
"horz",
"horzBrick",
"lgCheck",
"lgConfetti",
"lgGrid",
"ltDnDiag",
"ltHorz",
"ltUpDiag",
"ltVert",
"narHorz",
"narVert",
"openDmnd",
"pct10",
"pct20",
"pct25",
"pct30",
"pct40",
"pct5",
"pct50",
"pct60",
"pct70",
"pct75",
"pct80",
"pct90",
"plaid",
"shingle",
"smCheck",
"smConfetti",
"smGrid",
"solidDmnd",
"sphere",
"trellis",
"upDiag",
"vert",
"wave",
"wdDnDiag",
"wdUpDiag",
"weave",
"zigZag"];

var global_hatch_offsets_count = 54;

var global_hatch_brushes = {};

function CHatchBrush()
{
    this.Name   = "";
    this.Canvas = null;
    this.Ctx    = null;
    this.Data   = null;

    this.fgClr = { R : -1, G : -1, B : -1, A : 255 };
    this.bgClr = { R : -1, G : -1, B : -1, A : 255 };
}
CHatchBrush.prototype =
{
    Create : function(name)
    {
        this.Name = name;

        if (undefined === global_hatch_offsets[name])
            this.Name = "cross";

        if (!window["NATIVE_EDITOR_ENJINE"])
        {
            this.Canvas = document.createElement('canvas');
            this.Canvas.width = HATCH_TX_SIZE;
            this.Canvas.height = HATCH_TX_SIZE;

            this.Ctx = this.Canvas.getContext('2d');
            this.Data = this.Ctx.createImageData(HATCH_TX_SIZE, HATCH_TX_SIZE);
        }
        else
        {
            this.Data = new Uint8Array(4 * HATCH_TX_SIZE * HATCH_TX_SIZE);
        }
    },

    CheckColors : function(r,g,b,a,br,bg,bb,ba)
    {
        if (null == this.Data)
            return;

        if (this.fgClr.R == r && this.fgClr.G == g && this.fgClr.B == b && this.fgClr.A == a &&
            this.bgClr.R == br && this.bgClr.G == bg && this.bgClr.B == bb && this.bgClr.A == ba)
            return;

        this.fgClr.R = r;
        this.fgClr.G = g;
        this.fgClr.B = b;
        this.fgClr.A = a;

        this.bgClr.R = br;
        this.bgClr.G = bg;
        this.bgClr.B = bb;
        this.bgClr.A = ba;

        var _len = HATCH_TX_SIZE * HATCH_TX_SIZE;
        var _src_data_offset = global_hatch_offsets[this.Name] * _len;
        var _src_data = global_hatch_data;
        var _dst_data = this.Canvas ? this.Data.data : this.Data;
        var _ind = 0;

        for (var i = 0; i < _len; i++)
        {
            if (_src_data[_src_data_offset + i] == 0)
            {
                _dst_data[_ind++] = r;
                _dst_data[_ind++] = g;
                _dst_data[_ind++] = b;
                _dst_data[_ind++] = a;
            }
            else
            {
                _dst_data[_ind++] = br;
                _dst_data[_ind++] = bg;
                _dst_data[_ind++] = bb;
                _dst_data[_ind++] = ba;
            }
        }

        if (this.Canvas)
            this.Ctx.putImageData(this.Data, 0, 0);
    },

    toDataURL : function()
    {
        if (this.Canvas)
            return this.Canvas.toDataURL("image/png");

        return "data:onlyoffice_hatch," + AscCommon.Base64Encode(this.Data, 4 * HATCH_TX_SIZE * HATCH_TX_SIZE);
    }
};

function GetHatchBrush(name, r, g, b, a, br, bg, bb, ba)
{
    var _brush = global_hatch_brushes[name];
    if (_brush !== undefined)
    {
        _brush.CheckColors(r, g, b, a, br, bg, bb, ba);
        return _brush;
    }

    _brush = new CHatchBrush();
    _brush.Create(name);
    _brush.CheckColors(r, g, b, a, br, bg, bb, ba);
    global_hatch_brushes[name] = _brush;
    return _brush;
}

    //--------------------------------------------------------export----------------------------------------------------
    window['AscCommon'] = window['AscCommon'] || {};
    window['AscCommon'].global_hatch_names = global_hatch_names;
    window['AscCommon'].global_hatch_offsets = global_hatch_offsets;
    window['AscCommon'].GetHatchBrush = GetHatchBrush;
})(window);
