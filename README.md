# Inventra

Inventra is a Django-based inventory management application for small businesses and suppliers. It provides authenticated users with tools to manage tenants, inventory categories, products, stock movements, sales, suppliers, and staff through a clean web interface.

## Why Inventra is useful

- Centralizes inventory, sales, and supplier management in one application
- Supports product categorization, stock adjustments, and stock movement history
- Includes sales workflows for creating, confirming, canceling, and viewing sales
- Manages suppliers, active/inactive status, and supplier details
- Provides account and staff administration for team-based access
- Built for deployment with PostgreSQL and environment-based configuration

## Key features

- Tenant onboarding, registration, login, and logout
- Dashboard overview of inventory and business operations
- Category and product management with editable details
- Stock movement tracking and adjustments for inventory control
- Sales order creation, detail view, editing, confirmation, and cancellation
- Supplier directory with add, edit, delete, and toggle status actions
- Staff and profile management for authenticated users

## Technology stack

- Python 3.14
- Django 6.0
- Django REST Framework
- PostgreSQL
- Pillow for image handling
- python-decouple for environment configuration

## Getting started

### Requirements

- Python 3.14
- PostgreSQL
- Git

### Install

1. Clone the repository

```bash
git clone https://github.com/fredrickmwendwa/inventra.git
cd inventra
```

2. Create and activate a virtual environment

```bash
python -m venv venv
# Windows PowerShell
venv\Scripts\Activate.ps1
# Windows CMD
venv\Scripts\activate.bat
```

3. Install dependencies

```bash
pip install -r requirements.txt
```

4. Configure environment variables

```bash
copy .env.example .env
```

Edit `.env` and set the following values:

- `SECRET_KEY`
- `DEBUG`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_HOST`
- `DB_PORT`

5. Run database migrations

```bash
python manage.py migrate
```

6. Create a superuser

```bash
python manage.py createsuperuser
```

7. Collect static files

```bash
python manage.py collectstatic --noinput
```

8. Start the development server

```bash
python manage.py runserver
```

Open http://127.0.0.1:8000 to use Inventra.

## Project structure

- `apps/` - Django application modules for tenants, accounts, inventory, sales, suppliers, and dashboard
- `config/` - Django configuration, URL routing, WSGI/ASGI setup, and settings
- `templates/` - HTML templates used by the web UI
- `static/` and `staticfiles/` - CSS, JavaScript, and image assets
- `.env.example` - example environment variable settings
- `requirements.txt` - Python dependencies

## Where to get help

- Review app-level tests in `apps/*/tests.py`
- Open issues or pull requests on the repository
- Use GitHub issue tracking for bugs and enhancement requests

## Contributing

Contributions are welcome. See `CONTRIBUTING.md` for contribution guidance.
