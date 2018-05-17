/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2016, 2018. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/

/* eslint complexity: ["error", 28] */

import React from "react";
import PropTypes from "prop-types";
import Tabs from "ap-components-react/dist/components/Tabs";
import PropertyUtil from "./../../util/property-utils.js";
import { MESSAGE_KEYS, MESSAGE_KEYS_DEFAULTS, STATES, VALIDATION_MESSAGE } from "./../../constants/constants";
import isEmpty from "lodash/isEmpty";
import sortBy from "lodash/sortBy";
import logger from "./../../../../utils/logger";

import SelectorPanel from "./../../panels/selector";
import SummaryPanel from "./../../panels/summary";
import TwistyPanel from "./../../panels/twisty";
import SubPanelButton from "./../../panels/sub-panel/button.jsx";

import WideFlyout from "./../wide-flyout";
import FieldPicker from "./../field-picker";

import ButtonAction from "./../../actions/button";

import { injectIntl, intlShape } from "react-intl";

import Icon from "./../../../icons/icon.jsx";

const ALERT_TAB_GROUP = "alertMsgs";

class EditorForm extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			showFieldPicker: false,
			activeTabId: ""
		};

		this.genPanel = this.genPanel.bind(this);
		this.genUIContent = this.genUIContent.bind(this);
		this.genUIItem = this.genUIItem.bind(this);

		this.closeFieldPicker = this.closeFieldPicker.bind(this);
		this.openFieldPicker = this.openFieldPicker.bind(this);
		this.generateSharedControlNames = this.generateSharedControlNames.bind(this);

		this._showCategoryPanel = this._showCategoryPanel.bind(this);
		this._handleMessageClick = this._handleMessageClick.bind(this);

		this.messages = [];

		// initialize ControlFactory with correct values
		this.ControlFactory = props.controller.getControlFactory();
		this.ControlFactory.setFunctions(this.openFieldPicker, this.genUIItem);
		this.ControlFactory.setRightFlyout(props.rightFlyout);

		// set initial tab to first tab
		const tabs = props.controller.getUiItems()[0].tabs;
		this.state.activeTabId = this._getTabId(tabs[0]);
	}

	shouldComponentUpdate(nextProps, nextState) {
		if (!this.props.controller.isSummaryPanelShowing() && !this.props.controller.isSubPanelsShowing()) {
			// only update list of error messages when no summary panel or sub-panel is shown,
			// otherwise changes in the summary/sub panel might trigger a re-render and the
			// summary/sub panel to disappear because the alerts tab is added/removed
			this.messages = this._getGroupedMessages();
		}
		return true;
	}

	getControl(propertyName) {
		return this.refs[propertyName];
	}

	_getMessageCountForCategory(tab) {
		if (tab.group === ALERT_TAB_GROUP) {
			return " (" + this.messages.length + ")";
		}
		let result = 0;
		this.messages.forEach((msg) => {
			const ctrl = this.props.controller.getControl({ "name": msg.id_ref });
			if (ctrl && ctrl.parentCategoryId && ctrl.parentCategoryId.text === tab.text) {
				result++;
			}
		});
		return result > 0 ? " (" + result + ")" : null;
	}

	_getGroupedMessages() {
		// returns messages grouped by type, first errors, then warnings
		const messages = this.props.controller.getErrorMessages(true);
		if (!isEmpty(messages)) {
			return sortBy(messages, ["type"]);
		}
		return [];
	}

	_getTabId(tab) {
		if (this.props.rightFlyout) {
			return tab.text;
		}
		return "primary-tab." + tab.group;
	}

	_showCategoryPanel(panelid) {
		let activeTab = panelid;
		if (this.state.activeTabId === panelid) {
			activeTab = "";
		}
		this.setState({ activeTabId: activeTab });
	}

	_handleMessageClick(controlId, ev) {
		const control = this.props.controller.getControl(controlId);
		if (this.props.rightFlyout) {
			this._showCategoryPanel(this._getTabId(control.parentCategoryId));
		} else {
			this.setState({ activeTabId: this._getTabId(control.parentCategoryId) });
		}
	}

	_getPanelState(panelId) {
		const panelState = this.props.controller.getPanelState({ name: panelId });
		const stateStyle = {};
		const stateDisabled = {};
		if (panelState) {
			switch (panelState) {
			case STATES.DISABLED:
				stateDisabled.disabled = true;
				stateStyle.color = VALIDATION_MESSAGE.DISABLED;
				stateStyle.pointerEvents = "none";
				break;
			case STATES.HIDDEN:
				stateStyle.display = "none";
				break;
			default:
			}
		}

		return {
			state: panelState,
			disabled: stateDisabled,
			style: stateStyle
		};
	}

	genPrimaryTabs(key, tabs, propertyId, indexof) {
		const tabContent = [];
		let hasAlertsTab = false;
		for (var i = 0; i < tabs.length; i++) {
			const tab = tabs[i];
			if (i === 0 && tab.group === ALERT_TAB_GROUP) {
				hasAlertsTab = true;
			}
			const panelItems = this.genUIItem(this._getContainerIndex(hasAlertsTab, i), tab.content, propertyId, indexof);
			let additionalComponent = null;
			if (this.props.additionalComponents) {
				additionalComponent = this.props.additionalComponents[tab.group];
			}

			if (this.props.rightFlyout) {
				let panelArrow = <Icon type="downCaret" />;
				let panelItemsContainerClass = "closed";
				const styleObj = {};
				if (this.state.activeTabId === tab.text) {
					panelArrow = <Icon type="upCaret" />;
					panelItemsContainerClass = "open";
					if (i === tabs.length - 1) {
						styleObj.borderBottom = "none";
					}
				}
				const panelItemsContainer = (<div className={"panel-container-" + panelItemsContainerClass + "-right-flyout-panel"} style={styleObj}>
					{panelItems}
				</div>);

				tabContent.push(
					<div key={this._getContainerIndex(hasAlertsTab, i) + "-" + key} className="category-title-container-right-flyout-panel">
						<button type="button" onClick={this._showCategoryPanel.bind(this, tab.text)}
							id={"category-title-" + this._getContainerIndex(hasAlertsTab, i) + "-right-flyout-panel"}
							className="category-title-right-flyout-panel"
						>
							{tab.text.toUpperCase()}{this._getMessageCountForCategory(tab)}
							{panelArrow}
						</button>
						{panelItemsContainer}
						{additionalComponent}
					</div>
				);
			} else {
				tabContent.push(
					<Tabs.Panel
						id={this._getTabId(tab)}
						key={this._getContainerIndex(hasAlertsTab, i)}
						title={tab.text}
					>
						{panelItems}
						{additionalComponent}
					</Tabs.Panel>
				);
			}
		}

		if (this.props.rightFlyout) {
			return (
				<div key={key} id="category-parent-container-right-flyout-panel">
					{tabContent}
				</div>
			);
		}

		const that = this;
		return (
			<Tabs key={key}
				defaultActiveKey={0}
				animation={false}
				isTabActive={function active(id) {
					return id === that.state.activeTabId;
				}}
				onTabClickHandler={(e, id) => this.setState({ activeTabId: id })}
			>
				{tabContent}
			</Tabs>
		);
	}

	_getContainerIndex(hasAlertsTab, index) {
		// need to ensure that when alert tab is rendered, the existing tabs get the same id
		// otherwise re-render will cause controls to lose focus
		if (hasAlertsTab && index === 0) {
			return "alerts";
		}
		if (hasAlertsTab) {
			return index - 1;
		}
		return index;
	}

	genSubTabs(key, tabs, propertyId, indexof) {
		// logger.info("genSubTabs");
		const subTabs = [];
		for (let i = 0; i < tabs.length; i++) {
			const tab = tabs[i];
			const subPanelItems = this.genUIItem(i, tab.content, propertyId, indexof);
			if (this.props.rightFlyout) {

				const panelItemsContainer = (<div key={i + "-" + key} className="sub-panel-container-right-flyout-panel">
					{subPanelItems}
				</div>);

				subTabs.push(
					<div key={i + "-" + key} className="sub-category-items-container-right-flyout-panel">
						<h3 className="sub-category-title-right-flyout-panel">{tab.text}</h3>
						{panelItemsContainer}
					</div>
				);
			} else {
				subTabs.push(
					<Tabs.Panel
						id={"sub-tab." + tab.group}
						key={i}
						title={tab.text}
						className="sub-tab-parent-items-container"
					>
						{subPanelItems}
					</Tabs.Panel>
				);
			}
		}

		if (this.props.rightFlyout) {
			return (
				<div key={key} id="sub-category-parent-container-right-flyout-panel">
					{subTabs}
				</div>
			);
		}

		return (
			<div id={"sub-tab-container"}>
				<Tabs vertical animation={false}>
					{subTabs}
				</Tabs>
			</div>
		);
	}

	genPanelSelector(key, tabs, dependsOn, propertyId, indexof, panelId) {
		const panelConditions = this._getPanelState(panelId);
		const subPanels = this.generateAdditionalPanels(tabs, key, propertyId, indexof, false);
		return (
			<SelectorPanel id={"selector-panel." + dependsOn}
				style={panelConditions.style}
				key={"selectorPanel" + key}
				panels={subPanels}
				dependsOn={dependsOn}
				controller={this.props.controller}
			/>
		);
	}

	generateAdditionalPanels(tabs, key, propertyId, indexof, indent) {
		const subPanels = {};
		for (let i = 0; i < tabs.length; i++) {
			const tab = tabs[i];
			let className = "control-panel";
			if (tab.content && tab.content.itemType === "textPanel") {
				className = "text-panel";
			}
			if (indent) {
				className += " control-panel";
			}
			subPanels[tab.group] = (
				<div className={className} key={tab.group + key}>
					{this.genUIItem(i, tab.content, propertyId, indexof)}
				</div>
			);
		}

		return subPanels;
	}

	genUIContent(uiItems, propertyId, indexof) {
		var uiContent = [];
		for (var i = 0; i < uiItems.length; i++) {
			uiContent.push(this.genUIItem(i, uiItems[i], propertyId, indexof));
		}
		return uiContent;
	}

	/*
	*  propertyId and indexOf only used for subpanel in tables
	*/
	genUIItem(key, uiItem, inPropertyId, indexof) {
		if (uiItem.itemType === "control") {
			const propertyId = { name: uiItem.control.name };
			// Used for subpanels in tables
			if (inPropertyId) {
				propertyId.name = inPropertyId.name;
				propertyId.row = inPropertyId.row;
				propertyId.col = indexof(uiItem.control.name);
			}
			// If the uiItem has additonalPanels, this indicates that the uiItem is
			// a vertical radio button set followed by a SelectorPanel which has the
			// insert_panels boolean set to true.
			if (uiItem.additionalItems && uiItem.additionalItems.length > 0) {
				uiItem.control.additionalItems = uiItem.additionalItems;
				uiItem.control.optionalPanels =
					this.generateAdditionalPanels(uiItem.additionalItems, key, null, indexof, true);
			}
			return this.ControlFactory.createControlItem(uiItem.control, propertyId);
		} else if (uiItem.itemType === "additionalLink") {
			var subPanel = this.genPanel(key, uiItem.panel, inPropertyId, indexof);
			return (<SubPanelButton id={"sub-panel-button." + key}
				label={uiItem.text}
				title={uiItem.secondaryText}
				panel={subPanel}
				controller={this.props.controller}
				rightFlyout={this.props.rightFlyout}
			/>);
		} else if (uiItem.itemType === "staticText") {
			let textClass = "static-text";
			let icon = <div />;
			if (uiItem.textType === "info") {
				icon = <div className="static-text-icon-container"><Icon type="info" /></div>;
				textClass = "static-text info";
			}
			const text = <div className={textClass}>{PropertyUtil.evaluateText(uiItem.text, this.props.controller)}</div>;
			return <div key={"static-text." + key} className="static-text-container">{icon}{text}</div>;
		} else if (uiItem.itemType === "linkText") { // linkText used for Alerts tab. Only used internally
			let textClass = "link-text";
			let icon = <div />;
			if (uiItem.textType === "warning" || uiItem.textType === "error") {
				icon = <Icon type="circle" />;
				textClass = "link-text " + uiItem.textType;
			}
			const text = (
				<a className={textClass} onClick={this._handleMessageClick.bind(this, uiItem.controlId)}>
					{PropertyUtil.evaluateText(uiItem.text, this.props.controller)}
				</a>);
			return <div key={"link-text." + key} className={"link-text-container " + uiItem.textType} >{icon}{text}</div>;
		} else if (uiItem.itemType === "hSeparator") {
			return <hr key={"h-separator." + key} className="h-separator" />;
		} else if (uiItem.itemType === "panel") {
			return this.genPanel(key, uiItem.panel, inPropertyId, indexof);
		} else if (uiItem.itemType === "subTabs") {
			return this.genSubTabs(key, uiItem.tabs, inPropertyId, indexof);
		} else if (uiItem.itemType === "primaryTabs") {
			return this.genPrimaryTabs(key, uiItem.tabs, inPropertyId, indexof);
		} else if (uiItem.itemType === "panelSelector") {
			return this.genPanelSelector(key, uiItem.tabs, uiItem.dependsOn, inPropertyId, indexof, uiItem.id);
		} else if (uiItem.itemType === "checkboxSelector") {
			return this.genPanel(key, uiItem.panel, inPropertyId, indexof);
		} else if (uiItem.itemType === "customPanel") {
			return this.generateCustomPanel(key, uiItem.panel);
			// only generate summary panel for right side flyout
		} else if (uiItem.itemType === "action") {
			return this.generateAction(key, uiItem.action);
		} else if (uiItem.itemType === "textPanel" && uiItem.panel) {
			const panelConditions = this._getPanelState(uiItem.panel.id);
			const label = uiItem.panel.label ? (<div className="panel-label" style={panelConditions.style}>{uiItem.panel.label.text}</div>) : (<div />);
			const description = uiItem.panel.description
				? (<div className="panel-description" style={panelConditions.style}>{PropertyUtil.evaluateText(uiItem.panel.description.text, this.props.controller)}</div>)
				: (<div />);
			return (
				<div className="properties-text-panel" key={"text-panel-" + key} style={panelConditions.style}>
					{label}
					{description}
				</div>);
		}
		return <div key={"unknown." + key}>Unknown: {uiItem.itemType}</div>;
	}

	generateAction(key, action) {
		if (action) {
			if (action.actionType === "button") {
				return (
					<ButtonAction
						key={"action." + key}
						action={action}
						controller={this.props.controller}
					/>
				);
			}
		}
		return null;

	}

	generateCustomPanel(key, panel) {
		if (this.props.customPanels) {
			for (const custPanel of this.props.customPanels) {
				if (custPanel.id() === panel.id) {
					try {
						return (<div key={"custom." + key}>
							{new custPanel(panel.parameters, this.props.controller, panel.data).renderPanel()}
						</div>);
					} catch (error) {
						logger.warn("Error thrown creating custom panel: " + error);
						return (<div />);
					}
				}
			}
		}
		return <div>Panel Not Found: {panel.id}</div>;
	}

	generateSharedControlNames(panel) {
		for (const info of this.props.controller.getSharedCtrlInfo()) {
			if (typeof info.id !== "undefined" && info.id === panel.id) {
				return;
			}
		}
		const sharedCtrlNames = [];
		for (const panelItem of panel.uiItems) {
			// only push uiItems with controls.  Some uiItems are for display only and shouldn't be added.
			if (panelItem.control && panelItem.control.name) {
				const controlName = panelItem.control.name;
				sharedCtrlNames.push({
					"controlName": controlName
				});
			}
		}
		this.props.controller.addSharedControls(panel.id, sharedCtrlNames);
	}

	genPanel(key, panel, propertyId, indexof) {
		// logger.info("genPanel");
		// logger.info(panel);
		const content = this.genUIContent(panel.uiItems, propertyId, indexof);
		const id = "panel." + key;
		var uiObject;
		if (panel.panelType === "columnSelection") {
			this.generateSharedControlNames(panel);
			uiObject = (<div id={id}
				className="control-panel"
				key={key}
			>
				{content}
			</div>);
		} else if (panel.panelType === "summary") {
			uiObject = content;
			if (this.props.rightFlyout) {
				uiObject = (
					<SummaryPanel
						key={id}
						ref={panel.id}
						controller={this.props.controller}
						label={panel.label}
						panelId={panel.id}
					>
						{content}
					</SummaryPanel>);
			}
		} else if (panel.panelType === "actionPanel") {
			uiObject = (
				<div className="action-panel" key={key} >
					{content}
				</div>);
		} else if (panel.panelType === "twisty") {
			uiObject = (
				<TwistyPanel
					key={id}
					ref={panel.id}
					controller={this.props.controller}
					label={panel.label}
					panelId={panel.id}
				>
					{content}
				</TwistyPanel>);
		} else {
			uiObject = (<div id={id}
				className="control-panel"
				key={key}
			>
				{content}
			</div>);
		}

		return uiObject;
	}

	/**
	* Close the field picker and invoke callback function
	* @param newSelectedFields all fields selected, includes newSelections
	* @param newSelections the newly selected rows
	*/
	closeFieldPicker(newSelectedFields, newSelections) {
		if (this.closeFieldPickerCallback) {
			this.closeFieldPickerCallback(newSelectedFields, newSelections);
			this.closeFieldPickerCallback = null;
		}
		this.props.showPropertiesButtons(true);
		this.fieldPickerControl = null;
		this.setState({
			showFieldPicker: false
		});
	}

	/**
	* Opens the field picker
	* @param control the control opening the field picker
	* @param callback function to invoke when closing the field picker
	*/
	openFieldPicker(control, callback) {
		this.props.showPropertiesButtons(false);
		this.fieldPickerControl = control;
		this.closeFieldPickerCallback = callback;
		this.setState({
			showFieldPicker: true
		});
	}

	/**
	* Renders the field picker with the control's current selected values and fields
	* @param title string to display as the field picker's title
	*/
	fieldPicker(title) {
		if (this.fieldPickerControl && this.fieldPickerControl.name) {
			const controlName = this.fieldPickerControl.name;
			const currentControlValues = this.props.controller.getPropertyValue({ name: controlName });
			// if in columnSelectionPanel, filter out fields that are in the other controls
			const fields = this.props.controller.getFilteredDatasetMetadata({ name: controlName });
			// create a list of field names to be passed into the field picker
			const formattedFieldsList = PropertyUtil.getFieldsFromControlValues(this.fieldPickerControl, currentControlValues, fields);

			return (<div id="field-picker-table">
				<FieldPicker
					key="field-picker-control"
					controller={this.props.controller}
					closeFieldPicker={this.closeFieldPicker}
					currentFields={formattedFieldsList}
					fields={fields}
					title={title}
					rightFlyout={this.props.rightFlyout}
				/>
			</div>);
		}
		return <div />;
	}

	genAlertsTab(messages) {
		const msgUIItems = messages.map((msg) => (
			{
				"itemType": "linkText",
				"text": msg.text,
				"textType": msg.type,
				"controlId": { "name": msg.id_ref }
			}));

		return {
			"text": PropertyUtil.formatMessage(
				this.props.intl,
				MESSAGE_KEYS.ALERTS_TAB_TITLE,
				MESSAGE_KEYS_DEFAULTS.ALERTS_TAB_TITLE),
			"group": ALERT_TAB_GROUP,
			"content":
				{ "itemType": "panel",
					"panel": {
						"id": "alerts-panel",
						"panelType": "general",
						"uiItems": msgUIItems
					}
				}
		};
	}

	render() {
		let uiItems = this.props.controller.getUiItems();
		if (!isEmpty(this.messages) && uiItems[0].itemType === "primaryTabs") {
			// create a new copy for uiItems object so that alerts are not added multiple times
			uiItems = JSON.parse(JSON.stringify(this.props.controller.getUiItems()));
			uiItems[0].tabs.unshift(this.genAlertsTab(this.messages)); // add alerts tab to the beginning of the tabs array
		}

		let content = this.genUIContent(uiItems);
		let wideFly = <div />;

		const form = this.props.controller.getForm();
		const title = PropertyUtil.formatMessage(this.props.intl,
			MESSAGE_KEYS.FIELDPICKER_SAVEBUTTON_LABEL, MESSAGE_KEYS_DEFAULTS.FIELDPICKER_SAVEBUTTON_LABEL) + " " + form.label;

		if (this.props.rightFlyout) {
			const showFlyoutPicker = this.state.showFieldPicker && this.props.rightFlyout;
			wideFly = (<WideFlyout
				showPropertiesButtons={false}
				show={showFlyoutPicker}
				title={title}
			>
				{this.fieldPicker(title)}
			</WideFlyout>);
		} else if (this.state.showFieldPicker) {
			content = this.fieldPicker(title);
		}

		return (
			<div>
				<div className="well">
					<form className="form-horizontal">
						<div className="section--light">
							{content}
						</div>
					</form>
				</div>
				{wideFly}
			</div>
		);
	}
}

EditorForm.propTypes = {
	controller: PropTypes.object.isRequired,
	additionalComponents: PropTypes.object,
	showPropertiesButtons: PropTypes.func,
	customPanels: PropTypes.array,
	rightFlyout: PropTypes.bool,
	intl: intlShape
};

export default injectIntl(EditorForm);