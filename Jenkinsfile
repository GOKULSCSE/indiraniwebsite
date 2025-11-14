pipeline {
  agent {
    docker {
      image 'docker/compose:1.29.2'
      args '-v /var/run/docker.sock:/var/run/docker.sock'
    }
  }

  environment {
    COMPOSE_PROJECT_NAME = "ecommerce"
  }

  stages {
    stage('Clone Repo') {
      steps {
        git branch: 'main', url: 'git@bitbucket.org:buy-sell-cars/e-commerce_website.git'
      }
    }

    stage('Docker Rebuild & Restart') {
      steps {
        script {
          echo "🛑 Stopping and removing old containers"
          sh 'docker-compose down'

          echo "🔧 Building fresh images"
          sh 'docker-compose build --no-cache'

          echo "🚀 Starting up application"
          sh 'docker-compose up -d'
        }
      }
    }
  }
}
