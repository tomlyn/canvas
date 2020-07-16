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

import ReactResizeDetector from "react-resize-detector";
import ToolbarActionItem from "./toolbar-action-item.jsx";
import ToolbarExtensionItem from "./toolbar-extension-item.jsx";
import ToolbarDividerItem from "./toolbar-divider-item.jsx";

const INTER_BAR_PADDING = 36;
const EXTENSION_ICON_WIDTH = 36;
const LEFT = "left";
const RIGHT = "right";

class Toolbar extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			showExtendedMenu: false,
			toolbarWidth: 10000000 // Set toolbarWidth to initially accomodate all tools
		};

		this.onUpdate = false;
		this.toolbarRef = React.createRef();
		this.setToolbarWidth = this.setToolbarWidth.bind(this);
		this.toggleExtendedMenu = this.toggleExtendedMenu.bind(this);
	}

	// shouldComponentUpdate(nextProps, nextState) {
	// 	if (this.onUpdate === false) {
	// 		return !this.arePropsIdentical(nextProps, this.props);
	// 	}
	// 	return true;
	// }

	componentDidUpdate(prevProps, prevState, snapshot) {
		const that = this;
		setTimeout(function() {
			if (that.onUpdate === false) {
				that.onUpdate = true;
				// console.log("Setting toolbar width = " + that.toolbarRef.current.offsetWidth);
				that.setToolbarWidth();
			} else {
				// console.log("Stopping");
				that.onUpdate = false;
			}
		}, 20);
	}

	setToolbarWidth() {
		if (this.toolbarRef && this.toolbarRef.current && this.toolbarRef.current.offsetWidth) {
			this.setState({ toolbarWidth: this.toolbarRef.current.offsetWidth });
		}
	}

	arePropsIdentical(nextProps, thisProps) {
		return this.areBarsIdentical(nextProps.config.leftBar, this.props.config.leftBar) &&
						this.areBarsIdentical(nextProps.config.rightBar, this.props.config.rightBar);
	}

	areBarsIdentical(nextBar, thisBar) {
		if (!nextBar && !thisBar) {
			return true;
		}

		if ((nextBar && !thisBar) ||
				(!nextBar && thisBar)) {
			return false;
		}

		if (nextBar.length !== thisBar.length) {
			return false;
		}

		let state = true;

		for (let i = 0; i < nextBar.length; i++) {
			if (!this.areActionItemsIdentical(nextBar[i], thisBar[i])) {
				state = false;
			}
		}
		return state;
	}

	areActionItemsIdentical(nextActionItem, thisActionItem) {
		if (!nextActionItem && !thisActionItem) {
			return true;
		}

		if ((nextActionItem && !thisActionItem) ||
				(!nextActionItem && thisActionItem)) {
			return false;
		}

		if ((nextActionItem.divider && !thisActionItem.divider) ||
				(!nextActionItem.divider && thisActionItem.divider)) {
			return false;
		}

		if (nextActionItem.divider && thisActionItem.divider) {
			return true;
		}

		if (nextActionItem.action === thisActionItem.action &&
				nextActionItem.label === thisActionItem.label &&
				nextActionItem.enable === thisActionItem.enable &&
				nextActionItem.iconEnabled === thisActionItem.iconEnabled &&
				nextActionItem.iconDisabled === thisActionItem.iconDisabled &&
				nextActionItem.incLabelWithIcon === thisActionItem.incLabelWithIcon &&
				nextActionItem.className === thisActionItem.className &&
				nextActionItem.textContent === thisActionItem.textContent &&
				nextActionItem.iconTypeOverride === thisActionItem.iconTypeOverride &&
				nextActionItem.kind === thisActionItem.kind) {
			return true;
		}
		return false;
	}

	generateActionItems(definition, overflow, side, ext = "", start = 0, finish = definition.length) {
		const newItems = [];

		for (let i = start; i < finish; i++) {
			const actionObj = definition[i];
			let jsx = null;
			if (actionObj.action) {
				jsx = (
					<ToolbarActionItem
						key={"key-" + i}
						id={"toolbar_action_id-" + ext + side + "-" + i}
						actionObj={actionObj}
						toolbarActionHandler={this.props.toolbarActionHandler}
						overflow={overflow}
						instanceId={this.props.instanceId}
					/>
				);
			} else {
				jsx = (
					<ToolbarDividerItem
						key={"key-" + i}
						id={"toolbar_action_id-" + ext + side + "-" + i}
						index={i}
						overflow={overflow}
					/>
				);
			}
			newItems.push(jsx);
		}

		return newItems;
	}

	generateExtendedMenu(defItems, itemsToFit, side) {
		const extItems = defItems.slice(itemsToFit);

		const newItems = [];
		const items = this.generateActionItems(defItems, false, side, "", 0, itemsToFit);
		items.forEach((item) => newItems.push(item));

		const extensionItems = this.generateActionItems(extItems, true, side, "ext-");
		extensionItems.forEach((item) => this.extensionItems.push(item));

		return newItems;
	}

	generateExtendedMenuRight(defItems, itemsToFit, side) {
		const extItems = defItems.slice(0, defItems.length - itemsToFit);

		const newItems = [];
		const items = this.generateActionItems(defItems, false, side, "", defItems.length - itemsToFit, defItems.length);
		items.forEach((item) => newItems.push(item));

		const extensionItems = this.generateActionItems(extItems, true, side, "ext-");
		extensionItems.forEach((item) => this.extensionItems.push(item));

		return newItems;
	}

	generateExtendedIcon(extensionItems) {
		const jsx = (
			<ToolbarExtensionItem
				key={"key-ext"}
				id={"toolbar_extension_icon"}
				showExtendedMenu={this.state.showExtendedMenu}
				toggleExtendedMenu={this.toggleExtendedMenu}
				extensionMenuItems={extensionItems}
			/>
		);
		return jsx;
	}

	toggleExtendedMenu() {
		this.setState({ showExtendedMenu: !this.state.showExtendedMenu });
	}

	// Populates an array of widths where each element is the width of the
	// tool corresponding to its position in the associated definition array.
	// It only updates a width element if that width is greater than zero. This
	// prevents hidden elements (which are not shown in the main toolbar) from
	// returning a zero as their width and overwriting the actual width they
	// would occupy if they were to be displayed.
	calcItemWidths(currentWidths, size, side) {
		let widths = currentWidths;
		if (!currentWidths || currentWidths.length !== size) {
			widths = new Array(size);
			widths = widths.fill(0);
		}
		for (let i = 0; i < widths.length; i++) {
			const w = this.calcItemWidth(i, side);
			if (w && w > 0) {
				widths[i] = w;
			}
		}
		return widths;
	}

	// Returns the width of an item identified by the index and side parameters.
	calcItemWidth(index, side) {
		const id = "toolbar_action_id-" + side + "-" + index;
		const element = document.getElementById(id);
		let width = 0;
		if (element) {
			const rect = element.getBoundingClientRect();
			width = rect.width;
		}
		return width;
	}

	// Returns the sum of all the widths.
	calcTotalWidth(widths) {
		let sum = 0;
		widths.forEach((w) => {
			sum += w;
		});
		return sum;
	}

	// Returns the number of items from the array of widths that will fit into
	// the available width pased in.
	calcItemsToFit(widths, availableWidth) {
		let remainingWidth = availableWidth;
		let index = 0;

		for (let i = 0; i < widths.length && remainingWidth > 0; i++) {
			const itemWidth = widths[i];
			if (itemWidth <= remainingWidth) {
				remainingWidth -= itemWidth;
				index++;
			} else {
				remainingWidth = 0;
			}
		}
		return index;
	}

	calcItemsToFitRight(widths, availableWidth) {
		let remainingWidth = availableWidth;
		let index = widths.length;

		for (let i = widths.length - 1; i >= 0 && remainingWidth > 0; i--) {
			const itemWidth = widths[i];
			if (itemWidth <= remainingWidth) {
				remainingWidth -= itemWidth;
				index--;
			} else {
				remainingWidth = 0;
			}
		}
		return widths.length - index;
	}

	render() {
		const leftBar = this.props.config.leftBar || [];
		const rightBar = this.props.config.rightBar || [];

		let leftItems = this.generateActionItems(leftBar, false, LEFT);
		let rightItems = this.generateActionItems(rightBar, false, RIGHT);

		if (this.onUpdate) {
			this.leftWidths = this.calcItemWidths(this.leftWidths, leftBar.length, LEFT);
			this.rightWidths = this.calcItemWidths(this.rightWidths, rightBar.length, RIGHT);

			const leftItemsWidth = this.calcTotalWidth(this.leftWidths);
			const rightItemsWidth = this.calcTotalWidth(this.rightWidths);

			this.extensionItems = [];

			if (leftItemsWidth + rightItemsWidth + INTER_BAR_PADDING > this.state.toolbarWidth) {
				const leftAvailableWidth = this.state.toolbarWidth - rightItemsWidth - INTER_BAR_PADDING;
				const leftItemsToFit = this.calcItemsToFit(this.leftWidths, leftAvailableWidth);
				leftItems = this.generateExtendedMenu(leftBar, leftItemsToFit, LEFT);

				if (leftItemsToFit === 0) {
					const newLeftItemsWidth = EXTENSION_ICON_WIDTH;
					if (newLeftItemsWidth + rightItemsWidth > this.state.toolbarWidth) {
						const rightAvailableWidth = this.state.toolbarWidth - newLeftItemsWidth - (INTER_BAR_PADDING * 0.75);
						const rightItemsToFit = this.calcItemsToFitRight(this.rightWidths, rightAvailableWidth);
						rightItems = this.generateExtendedMenuRight(rightBar, rightItemsToFit, RIGHT);
					}
				}

				if (this.extensionItems.length > 0) {
					const extensionIcon = this.generateExtendedIcon(this.extensionItems, LEFT);
					leftItems.push(extensionIcon);
				}
			}
		}

		const leftClassName = "toolbar-items-container" + (this.onUpdate ? "" : " toolbar-hidden");
		const rightClassName = "toolbar-items-container toolbar-right-items-container" + (this.onUpdate ? "" : " toolbar-hidden");

		const leftContainer = (
			<div className={leftClassName}>
				{leftItems}
			</div>
		);

		const rightContainer = (
			<div className={rightClassName}>
				{rightItems}
			</div>
		);

		const canvasToolbar = (
			<ReactResizeDetector handleWidth onResize={this.setToolbarWidth}>
				<div className="toolbar-div" ref={ this.toolbarRef }>
					{leftContainer}
					{rightContainer}
				</div>
			</ReactResizeDetector>);

		return canvasToolbar;
	}
}

Toolbar.propTypes = {
	config: PropTypes.object.isRequired,
	instanceId: PropTypes.number,
	toolbarActionHandler: PropTypes.func
};

export default Toolbar;
