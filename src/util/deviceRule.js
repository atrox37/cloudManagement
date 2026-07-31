const toEnumKey = (value, enumData) => {
  if (value == null) return value;

  const valueText = String(value);
  const keyItem = enumData.find((item) => String(item.key) === valueText);
  if (keyItem) return String(keyItem.key);

  const labelItem = enumData.find((item) => String(item.value) === valueText);
  return labelItem ? String(labelItem.key) : value;
};

const normalizeRuleModel = (rule, enumProperties) => {
  const params = rule?.ruleMeta?.param;
  if (!params || typeof params !== "object") return;

  for (const [propertyId, enumData] of enumProperties) {
    if (!Object.prototype.hasOwnProperty.call(params, propertyId)) continue;

    const values = params[propertyId];
    params[propertyId] = Array.isArray(values)
      ? values.map((value) => toEnumKey(value, enumData))
      : toEnumKey(values, enumData);
  }
};

export const normalizeEnumRuleParams = (metadata, ruleChanges = []) => {
  if (!metadata) return;

  const enumProperties = new Map(
    (metadata.properties || [])
      .filter(
        (property) =>
          property?.valueType?.type === "enum" &&
          Array.isArray(property.valueType.extra?.enumData)
      )
      .map((property) => [
        String(property.id),
        property.valueType.extra.enumData
      ])
  );

  if (enumProperties.size === 0) return;

  for (const rule of metadata.rules || []) {
    normalizeRuleModel(rule, enumProperties);
  }
  for (const change of ruleChanges || []) {
    normalizeRuleModel(change?.ruleModel, enumProperties);
  }
};
