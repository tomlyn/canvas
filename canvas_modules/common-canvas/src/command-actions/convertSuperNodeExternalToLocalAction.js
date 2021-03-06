/*
 * Copyright 2021 Elyra Authors
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

export default class ConvertSuperNodeExternalToLocal extends Action {
	constructor(data, objectModel) {
		super(data);
		this.data = data;
		this.objectModel = objectModel;
		this.apiPipeline = this.objectModel.getAPIPipeline(data.pipelineId);
	}

	do() {
		this.objectModel.convertSuperNodeExternalToLocal({
			supernode: this.data.targetObject,
			pipelineId: this.data.pipelineId,
			externalFlowUrl: this.data.externalUrl,
			externalPipelineFlow: this.data.externalPipelineFlow
		});
	}

	undo() {
		this.objectModel.convertSuperNodeLocalToExternal({
			supernode: this.data.targetObject,
			pipelineId: this.data.pipelineId,
			externalFlowUrl: this.data.externalUrl,
			externalPipelineFlowId: this.data.externalPipelineFlow.id
		});
	}

	redo() {
		this.do();
	}
}
