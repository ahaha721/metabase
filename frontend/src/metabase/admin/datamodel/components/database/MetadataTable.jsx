import React, { Component } from "react";
import PropTypes from "prop-types";

import MetricsList from "./MetricsList.jsx";
import ColumnsList from "./ColumnsList.jsx";
import SegmentsList from "./SegmentsList.jsx";
import { t } from "ttag";
import InputBlurChange from "metabase/components/InputBlurChange.jsx";
import ProgressBar from "metabase/components/ProgressBar.jsx";
import Databases from "metabase/entities/databases";
import Tables from "metabase/entities/tables";
import { normal } from "metabase/lib/colors";
import withTableMetadataLoaded from "metabase/admin/datamodel/withTableMetadataLoaded";

import _ from "underscore";
import cx from "classnames";

@Databases.load({ id: (state, { databaseId }) => databaseId, wrapped: true })
@Tables.load({ id: (state, { tableId }) => tableId, wrapped: true })
@withTableMetadataLoaded
export default class MetadataTable extends Component {
  constructor(props, context) {
    super(props, context);
    this.onDescriptionChange = this.onDescriptionChange.bind(this);
    this.onNameChange = this.onNameChange.bind(this);
    this.updateProperty = this.updateProperty.bind(this);
  }

  static propTypes = {
    table: PropTypes.object,
    idfields: PropTypes.array,
    updateField: PropTypes.func.isRequired,
    onRetireMetric: PropTypes.func.isRequired,
    onRetireSegment: PropTypes.func.isRequired,
  };

  componentWillMount() {
    const { database } = this.props;
    if (database) {
      database.fetchIdfields();
    }
  }

  componentDidUpdate({ database: { id: prevId } = {} }) {
    const { database = {} } = this.props;
    if (database.id !== prevId) {
      database.fetchIdfields();
    }
  }

  isHidden() {
    return !!this.props.table.visibility_type;
  }

  updateProperty(name, value) {
    this.setState({ saving: true });
    this.props.table.update({ [name]: value });
  }

  onNameChange(event) {
    if (!_.isEmpty(event.target.value)) {
      this.updateProperty("display_name", event.target.value);
    } else {
      // if the user set this to empty then simply reset it because that's not allowed!
      event.target.value = this.props.table.display_name;
    }
  }

  onDescriptionChange(event) {
    this.updateProperty("description", event.target.value);
  }

  renderVisibilityType(text, type, any) {
    let classes = cx(
      "mx1",
      "text-bold",
      "text-brand-hover",
      "cursor-pointer",
      "text-default",
      {
        "text-brand":
          this.props.table.visibility_type === type ||
          (any && this.props.table.visibility_type),
      },
    );
    return (
      <span
        className={classes}
        onClick={this.updateProperty.bind(null, "visibility_type", type)}
      >
        {text}
      </span>
    );
  }

  renderVisibilityWidget() {
    let subTypes;
    if (this.props.table.visibility_type) {
      subTypes = (
        <span id="VisibilitySubTypes" className="border-left mx2">
          <span className="mx2 text-uppercase text-medium">{t`Why Hide?`}</span>
          {this.renderVisibilityType(t`Technical Data`, "technical")}
          {this.renderVisibilityType(t`Irrelevant/Cruft`, "cruft")}
        </span>
      );
    }
    return (
      <span id="VisibilityTypes">
        {this.renderVisibilityType(t`Queryable`, null)}
        {this.renderVisibilityType(t`Hidden`, "hidden", true)}
        {subTypes}
      </span>
    );
  }

  render() {
    const { table, onRetireMetric, onRetireSegment } = this.props;
    if (!table) {
      return false;
    }

    return (
      <div className="MetadataTable full px3">
        <div className="MetadataTable-title flex flex-column bordered rounded">
          <InputBlurChange
            className="AdminInput TableEditor-table-name text-bold border-bottom rounded-top"
            type="text"
            value={table.display_name || ""}
            onBlurChange={this.onNameChange}
          />
          <InputBlurChange
            className="AdminInput TableEditor-table-description rounded-bottom"
            type="text"
            value={table.description || ""}
            onBlurChange={this.onDescriptionChange}
            placeholder={t`No table description yet`}
          />
        </div>
        <div className="MetadataTable-header flex align-center py2 text-medium">
          <span className="mx1 text-uppercase">{t`Visibility`}</span>
          {this.renderVisibilityWidget()}
          <span className="flex-align-right flex align-center">
            <span className="text-uppercase mr1">{t`Metadata Strength`}</span>
            <span style={{ width: 64 }}>
              <ProgressBar
                percentage={table.metadataStrength}
                color={normal.grey2}
              />
            </span>
          </span>
        </div>
        <div className={"mt2 " + (this.isHidden() ? "disabled" : "")}>
          <SegmentsList onRetire={onRetireSegment} tableMetadata={table} />
          <MetricsList onRetire={onRetireMetric} tableMetadata={table} />
          {this.props.idfields && (
            <ColumnsList
              fields={table.fields}
              updateField={this.props.updateField}
              idfields={this.props.idfields}
            />
          )}
        </div>
      </div>
    );
  }
}
