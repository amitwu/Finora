import sqlalchemy

engine = sqlalchemy.create_engine(
#    "mssql+pyodbc://gemini_user:StrongPassword123!@localhost/budgetappgeminidb?driver=ODBC+Driver+17+for+SQL+Server")
"mssql+pyodbc://TLV-WPSVG\awurom@localhost/budgetappgeminidb?driver=ODBC+Driver+17+for+SQL+Server")

with engine.connect() as conn:
    print("Connection successful!")