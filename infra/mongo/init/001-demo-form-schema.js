db = db.getSiblingDB("fox_procureflow");

db.dynamic_form_schemas.insertOne({
  schemaKey: "purchase-intake-placeholder",
  ownerScope: "group-xinghe",
  description: "采购申请动态表单 schema 占位，真实字段由后续 Intake change 定义。",
  createdAt: new Date()
});
