/*
 * Copyright 2017-2024 Elyra Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import Action from "../command-stack/action.js";
import { CANVAS_FOCUS } from "../common-canvas/constants/canvas-constants.js";

export default class CreateCommentAction extends Action {
	constructor(data, canvasController) {
		super(data);
		this.data = data;
		this.labelUtil = canvasController.labelUtil;
		this.objectModel = canvasController.objectModel;
		this.apiPipeline = this.objectModel.getAPIPipeline(data.pipelineId);

		this.comment = this.apiPipeline.createComment(data);
	}

	getData() {
		this.data.comment = this.comment;
		return this.data;
	}

	// Standard methods
	do() {
		this.apiPipeline.addComment(this.comment);
		this.focusObject = this.comment;
	}

	undo() {
		this.apiPipeline.deleteComment(this.comment.id);
		this.focusObject = CANVAS_FOCUS;
	}

	redo() {
		this.do();
	}

	getLabel() {
		return this.labelUtil.getActionLabel(this, "action.createComment");
	}

	getFocusObject() {
		return this.focusObject;
	}
}
