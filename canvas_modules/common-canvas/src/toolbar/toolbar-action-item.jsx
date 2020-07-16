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

import Tooltip from "../tooltip/tooltip.jsx";
import Icon from "../icons/icon.jsx";
import Button from "carbon-components-react/lib/components/Button";
import SVG from "react-inlinesvg";
import classNames from "classnames";

class ToolbarActionItem extends React.Component {
	constructor(props) {
		super(props);

		this.actionClickHandler = this.actionClickHandler.bind(this);
	}

	generateLabel(label, disable, overflow) {
		let className = "toolbar-icon-label";
		className += overflow ? " overflow" : "";
		className += disable ? " disabled" : "";
		return (<div className={className}>{label}</div>);
	}

	generateIcon(actionObj) {
		const customClassname = actionObj.className ? actionObj.className : "";
		const iconType = actionObj.iconTypeOverride ? actionObj.iconTypeOverride : actionObj.action;
		let icon = <Icon type={iconType} disabled={!actionObj.enable} className={customClassname} />;

		// Customer provided icon.
		if (actionObj.iconEnabled) {
			const iconEnabled = actionObj.iconEnabled;
			const iconDisabled = actionObj.iconDisabled || actionObj.iconEnabled;
			const customIcon = actionObj.enable ? iconEnabled : iconDisabled;
			const id = "toolbar-icon-" + this.props.instanceId + " -" + actionObj.action;

			if (typeof customIcon === "string") {
				icon = (<SVG id={id} className={customClassname} disabled={!actionObj.enable}
					src={customIcon}
				/>);
			} else {
				icon = customIcon;
			}
		}
		return icon;
	}

	actionClickHandler() {
		this.props.toolbarActionHandler(this.props.actionObj.action);
	}

	render() {
		const actionObj = this.props.actionObj;

		let labelBefore = null;
		let labelAfter = null;

		if (this.props.overflow) {
			labelAfter = this.generateLabel(actionObj.label, !actionObj.enable, true);

		} else if (actionObj.incLabelWithIcon === "before") {
			labelBefore = this.generateLabel(actionObj.label, !actionObj.enable, false);

		} else if (actionObj.incLabelWithIcon === "after") {
			labelAfter = this.generateLabel(actionObj.label, !actionObj.enable, false);
		}

		const icon = this.generateIcon(actionObj);
		const textContent = actionObj.textContent ? (<div className="toolbar-text-content"> {actionObj.textContent} </div>) : null;
		const tooltipId = actionObj.action + "-action-" + this.props.instanceId + "-tooltip";
		const buttonClassName = classNames("toolbar-button-item", { "overflow": this.props.overflow, "disabled": !actionObj.enable });
		const divClassName = classNames("toolbar-item", { "overflow": this.props.overflow, "disabled": !actionObj.enable });
		const style = this.props.overflow ? {} : { width: "fit-content" };

		return (
			<div id={this.props.id} style={ style } >
				<Button kind="ghost"
					onClick={this.actionClickHandler}
					className={buttonClassName}
					disabled={!actionObj.enable}
				>
					<Tooltip id={tooltipId} tip={actionObj.label} disable={this.props.overflow}>
						<div className={divClassName}>
							{labelBefore}
							{icon}
							{labelAfter}
							{textContent}
						</div>
					</Tooltip>
				</Button>
			</div>
		);
	}
}

ToolbarActionItem.propTypes = {
	actionObj: PropTypes.shape({
		action: PropTypes.string.isRequired,
		label: PropTypes.oneOfType([
			PropTypes.string,
			PropTypes.object
		]),
		incLabelWithIcon: PropTypes.oneOf(["no", "before", "after"]),
		enable: PropTypes.bool,
		iconEnabled: PropTypes.object,
		iconDisabled: PropTypes.obect,
		className: PropTypes.string,
		textContent: PropTypes.string,
		iconTypeOverride: PropTypes.string,
		kind: PropTypes.string
	}),
	id: PropTypes.string.isRequired,
	toolbarActionHandler: PropTypes.func.isRequired,
	instanceId: PropTypes.number.isRequired,
	overflow: PropTypes.bool
};

export default ToolbarActionItem;
