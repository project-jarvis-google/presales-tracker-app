from database import get_db

ALLOWED_COLUMNS = {
    'account_name', 'opportunity', 'region_location', 'region', 'sub_region',
    'deal_value_usd', 'scoping_doc', 'vector_link', 'charging_on_vector',
    'period_of_presales_weeks', 'status', 'assignee_from_gsd', 'pursuit_lead',
    'delivery_manager', 'presales_start_date', 'expected_planned_start',
    'sow_signature_date', 'staffing_completed_flag', 'staffing_poc', 'remarks'
}

def _dict_from_row(cursor, row):
    """Convert pg8000 row to dictionary"""
    if row is None:
        return None
    columns = [desc[0] for desc in cursor.description]
    return dict(zip(columns, row))

# CREATE
def create_record(data):
    """Insert new record"""
    conn = get_db()
    cursor = conn.cursor()
    query = """
        INSERT INTO presales_tracking (
            account_name, opportunity, region_location, region, sub_region,
            deal_value_usd, scoping_doc, vector_link, charging_on_vector,
            period_of_presales_weeks, status, assignee_from_gsd, pursuit_lead,
            delivery_manager, presales_start_date, expected_planned_start,
            sow_signature_date, staffing_completed_flag, staffing_poc, remarks
        ) VALUES (
            %s, %s, %s, %s, %s,
            %s, %s, %s, %s,
            %s, %s, %s, %s,
            %s, %s, %s,
            %s, %s, %s, %s
        ) RETURNING *;
    """
    values = (
        data.get('account_name'),
        data.get('opportunity'),
        data.get('region_location'),
        data.get('region'),
        data.get('sub_region'),
        data.get('deal_value_usd'),
        data.get('scoping_doc'),
        data.get('vector_link'),
        data.get('charging_on_vector'),
        data.get('period_of_presales_weeks'),
        data.get('status'),
        data.get('assignee_from_gsd'),
        data.get('pursuit_lead'),
        data.get('delivery_manager'),
        data.get('presales_start_date'),
        data.get('expected_planned_start'),
        data.get('sow_signature_date'),
        data.get('staffing_completed_flag'),
        data.get('staffing_poc'),
        data.get('remarks'),
    )
    cursor.execute(query, values)
    result = cursor.fetchone()
    conn.commit()
    result_dict = _dict_from_row(cursor, result)
    conn.close()
    return result_dict

# READ ALL
def get_all_records():
    """Get all records"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM presales_tracking ORDER BY id ASC")
    results = cursor.fetchall()
    records = [_dict_from_row(cursor, row) for row in results]
    conn.close()
    return records

# READ ONE
def get_record_by_id(record_id):
    """Get single record by ID"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM presales_tracking WHERE id = %s", (record_id,))
    result = cursor.fetchone()
    result_dict = _dict_from_row(cursor, result)
    conn.close()
    return result_dict

# UPDATE
def update_record(record_id, data):
    """Update record by ID"""
    conn = get_db()
    cursor = conn.cursor()
    # Filter out None values and validate column names
    updates = []
    values = []
    for key, value in data.items():
        if value is not None and key in ALLOWED_COLUMNS:
            updates.append(f"{key} = %s")
            values.append(value)
    if not updates:
        conn.close()
        return None
    values.append(record_id)
    query = f"UPDATE presales_tracking SET {', '.join(updates)} WHERE id = %s RETURNING *"
    cursor.execute(query, values)
    result = cursor.fetchone()
    conn.commit()
    result_dict = _dict_from_row(cursor, result)
    conn.close()
    return result_dict

# DELETE
def delete_record(record_id):
    """Delete record by ID"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM presales_tracking WHERE id = %s RETURNING id", (record_id,))
    result = cursor.fetchone()
    conn.commit()
    conn.close()
    return result is not None