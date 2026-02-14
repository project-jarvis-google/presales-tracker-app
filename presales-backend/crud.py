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
    """Insert new record - accepts None/null values for optional fields"""
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
    # Use .get() with None as default - this properly handles null values from frontend
    values = (
        data.get('account_name'),  # Required field
        data.get('opportunity', None),  # Optional - can be NULL
        data.get('region_location', None),
        data.get('region', None),
        data.get('sub_region', None),
        data.get('deal_value_usd', None),
        data.get('scoping_doc', None),
        data.get('vector_link', None),
        data.get('charging_on_vector', None),
        data.get('period_of_presales_weeks', None),
        data.get('status', None),
        data.get('assignee_from_gsd', None),
        data.get('pursuit_lead', None),
        data.get('delivery_manager', None),
        data.get('presales_start_date', None),
        data.get('expected_planned_start', None),
        data.get('sow_signature_date', None),
        data.get('staffing_completed_flag', False),  # Boolean - default to False
        data.get('staffing_poc', None),
        data.get('remarks', None),
    )
    
    try:
        cursor.execute(query, values)
        result = cursor.fetchone()
        conn.commit()
        result_dict = _dict_from_row(cursor, result)
        return result_dict
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

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
    """Update record by ID - properly handles NULL values"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Build update query - include fields even if they are None/null
    # This allows clearing fields by setting them to NULL
    updates = []
    values = []
    
    for key in ALLOWED_COLUMNS:
        if key in data:  # Only update fields that are present in the data dict
            updates.append(f"{key} = %s")
            values.append(data[key])  # Include even if None - this sets to NULL
    
    if not updates:
        conn.close()
        return None
    
    values.append(record_id)
    query = f"UPDATE presales_tracking SET {', '.join(updates)} WHERE id = %s RETURNING *"
    
    try:
        cursor.execute(query, values)
        result = cursor.fetchone()
        conn.commit()
        result_dict = _dict_from_row(cursor, result)
        return result_dict
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

# DELETE
def delete_record(record_id):
    """Delete record by ID"""
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM presales_tracking WHERE id = %s RETURNING id", (record_id,))
        result = cursor.fetchone()
        conn.commit()
        return result is not None
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()