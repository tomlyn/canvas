/*
 * Copyright 2017-2020 IBM Corporation
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

import React from "react";
import PropTypes from "prop-types";

import Icon from "../icons/icon.jsx";
import Button from "carbon-components-react/lib/components/Button";
import { CANVAS_CARBON_ICONS } from "../common-canvas/constants/canvas-constants";

class ToolbarExtensionItem extends React.Component {
	constructor(props) {
		super(props);
		this.toggleExtendedMenu = this.toggleExtendedMenu.bind(this);
	}

	toggleExtendedMenu() {
		this.props.toggleExtendedMenu();
	}

	render() {
		const subMenuClassName = this.props.showExtendedMenu === true ? "" : "toolbar-popover-list-hide";

		return (
			<div id={this.props.id} key={"overflow-action"} >
				<Button kind="ghost"
					onClick={this.toggleExtendedMenu}
					className="toolbar-button-item"
				>
					<div className="toolbar-item">
						<Icon type={CANVAS_CARBON_ICONS.OVERFLOWMENU} />
					</div>
				</Button>
				<ul className={"toolbar-popover-list " + subMenuClassName}>
					{this.props.extensionMenuItems}
				</ul>
			</div>
		);
	}
}

ToolbarExtensionItem.propTypes = {
	id: PropTypes.string.isRequired,
	showExtendedMenu: PropTypes.bool.isRequired,
	toggleExtendedMenu: PropTypes.func.isRequired,
	extensionMenuItems: PropTypes.array
};

export default ToolbarExtensionItem;
